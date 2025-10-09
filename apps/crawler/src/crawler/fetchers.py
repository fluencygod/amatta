from __future__ import annotations

import time
import os
import random
from datetime import datetime
from typing import Iterable, List, Optional

import feedparser
import requests
from bs4 import BeautifulSoup

from .db import session_scope, Base, engine
from .models import Article, CrawlLog
from .sites import SiteConfig
from .rules import get_site_rule, extract_from_html


UA = os.getenv("CRAWLER_USER_AGENT", "news-crawler/1.0 (+https://example.com)")
REQ_DELAY = float(os.getenv("CRAWLER_REQUEST_DELAY", "0.3"))
REQ_JITTER = float(os.getenv("CRAWLER_REQUEST_JITTER", "0.25"))


def ensure_tables():
    Base.metadata.create_all(bind=engine)


def fetch_rss_entries(rss_urls: Iterable[str], timeout: int = 10) -> List[dict]:
    out: List[dict] = []
    for url in rss_urls:
        feed = feedparser.parse(url)
        if getattr(feed, "entries", None):
            out.extend(feed.entries)
        # polite pause between multiple RSS endpoints
        time.sleep(REQ_DELAY + random.random() * REQ_JITTER)
    return out


def clean_html(text: Optional[str]) -> Optional[str]:
    if not text:
        return text
    soup = BeautifulSoup(text, "lxml")
    return soup.get_text(" ", strip=True)


def http_get(url: str, *, retries: int = 3, backoff: float = 0.8) -> Optional[str]:
    delay = 0.5
    for attempt in range(retries):
        try:
            r = requests.get(url, headers={"User-Agent": UA}, timeout=12)
            if r.ok:
                return r.text
        except Exception:
            pass
        time.sleep(delay)
        delay *= (1.0 + backoff)
    return None


def maybe_extract_main_image(entry: dict) -> Optional[str]:
    # Try common fields in RSS feeds
    for key in ("media_content", "media_thumbnail"):
        val = entry.get(key)
        if isinstance(val, list) and val:
            url = val[0].get("url")
            if url:
                return url
    if entry.get("image") and isinstance(entry["image"], dict):
        return entry["image"].get("href")
    # fallback: look in summary for <img>
    html = entry.get("summary") or entry.get("content", [{}])[0].get("value")
    if html:
        soup = BeautifulSoup(html, "lxml")
        img = soup.find("img")
        if img and img.get("src"):
            return img["src"]
    return None


def fetch_site(config: SiteConfig, limit: int = 100, site_key: str | None = None) -> int:
    ensure_tables()
    entries = fetch_rss_entries(config.rss)
    if not entries:
        with session_scope() as s:
            s.add(CrawlLog(site=config.name, status="error", saved=0, failed=0, message="no entries"))
        return 0
    # Sort by published if present
    def parse_dt(e):
        dt = None
        for k in ("published_parsed", "updated_parsed"):
            if e.get(k):
                try:
                    dt = datetime(*e[k][:6])
                    break
                except Exception:
                    pass
        return dt

    entries.sort(key=lambda e: parse_dt(e) or datetime.utcnow(), reverse=True)
    saved = 0
    failed = 0
    with session_scope() as s:
        for entry in entries[:limit]:
            url = entry.get("link") or entry.get("id")
            title = clean_html(entry.get("title")) or ""
            if not url or not title:
                failed += 1
                continue
            summary = clean_html(entry.get("summary"))
            published_at = parse_dt(entry)
            image_url = maybe_extract_main_image(entry)
            # If we have site-specific rules, enrich/override by fetching the article HTML
            rule = get_site_rule(site_key or "")
            if rule and url:
                html = http_get(url) or ""
                if html:
                    parsed = extract_from_html(html, rule)
                    # Prefer parsed results when available
                    if parsed.get("title"):
                        title = parsed["title"]
                    if parsed.get("content"):
                        # derive summary from content if RSS summary missing
                        if not summary:
                            summary = (parsed["content"][:400] + "…") if len(parsed["content"]) > 400 else parsed["content"]
                    if parsed.get("image_url"):
                        image_url = parsed["image_url"]
                    if parsed.get("published_at"):
                        published_at = parsed["published_at"]
            try:
                # Duplicate check: by URL or by (title + published date same day)
                exists = s.query(Article).filter(Article.url == url).first()
                if not exists and published_at is not None:
                    start = datetime(published_at.year, published_at.month, published_at.day)
                    end = start.replace(hour=23, minute=59, second=59)
                    exists = (
                        s.query(Article)
                        .filter(
                            Article.title == title[:512],
                            Article.published_at >= start,
                            Article.published_at <= end,
                            Article.site == config.name,
                        )
                        .first()
                    )
                if exists:
                    continue
                art = Article(
                    site=config.name,
                    url=url,
                    title=title[:512],
                    summary=summary,
                    content=None,  # optionally store parsed content later
                    author=None,
                    category=None,
                    image_url=image_url,
                    published_at=published_at,
                )
                s.add(art)
                s.flush()
                saved += 1
            except Exception as e:
                s.rollback()
                failed += 1
            # polite pause between entries to avoid burst traffic
            time.sleep(REQ_DELAY + random.random() * REQ_JITTER)
        s.add(CrawlLog(site=config.name, status="ok", saved=saved, failed=failed, message=None))
    # simple stdout log for Airflow task logs
    print(f"[crawler] site={config.name} saved={saved} failed={failed}")
    return saved
