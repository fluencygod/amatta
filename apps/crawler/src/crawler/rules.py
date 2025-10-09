from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, List

from bs4 import BeautifulSoup


@dataclass(frozen=True)
class SiteRule:
    title_selectors: List[str]
    content_selectors: List[str]
    date_meta_props: List[str] = None  # e.g., ['article:published_time', 'og:article:published_time']
    image_meta_props: List[str] = None  # e.g., ['og:image']


def parse_datetime(dt_str: str) -> Optional[datetime]:
    if not dt_str:
        return None
    dt_str = dt_str.strip()
    for fmt in [
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M",
        "%Y.%m.%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
    ]:
        try:
            return datetime.strptime(dt_str, fmt)
        except Exception:
            continue
    return None


def extract_from_html(html: str, rule: SiteRule) -> Dict[str, Optional[str | datetime]]:
    soup = BeautifulSoup(html, "lxml")
    out: Dict[str, Optional[str | datetime]] = {
        "title": None,
        "content": None,
        "published_at": None,
        "image_url": None,
    }
    # title
    for sel in rule.title_selectors:
        node = soup.select_one(sel)
        if node and node.get_text(strip=True):
            out["title"] = node.get_text(strip=True)
            break
    if not out["title"]:
        ogt = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name":"og:title"})
        if ogt and ogt.get("content"):
            out["title"] = ogt["content"].strip()
    # content
    parts: List[str] = []
    for sel in rule.content_selectors:
        for node in soup.select(sel):
            txt = node.get_text(" ", strip=True)
            if txt:
                parts.append(txt)
        if parts:
            break
    if parts:
        out["content"] = "\n".join(parts)
    # date
    for prop in (rule.date_meta_props or []):
        meta = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if meta and meta.get("content"):
            dt = parse_datetime(meta["content"]) 
            if dt:
                out["published_at"] = dt
                break
    # image
    for prop in (rule.image_meta_props or ["og:image"]):
        meta = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if meta and meta.get("content"):
            out["image_url"] = meta["content"].strip()
            break
    return out


RULES: Dict[str, SiteRule] = {
    # 경향신문
    "khan": SiteRule(
        title_selectors=["h1.tit-article", "h1#article_title", "h1"],
        content_selectors=["#articleBody", ".art_body", ".article-txt", ".article_body"],
        date_meta_props=["article:published_time", "og:article:published_time", "date"],
        image_meta_props=["og:image"],
    ),
    # 매일경제
    "mk": SiteRule(
        title_selectors=["h2#top_header", "h1.news_ttl", "h1"],
        content_selectors=["#article_body", ".art_txt", ".art_txt p"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
    # 동아일보
    "donga": SiteRule(
        title_selectors=["h1.tit", "h1#content_title", "h1"],
        content_selectors=["#content", ".article_txt", ".article_view"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
    # 한국일보
    "hankook": SiteRule(
        title_selectors=["h1.headline", "h1"],
        content_selectors=["#article-view-content-div", ".article-body", ".story-news"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
    # 아시아투데이
    "asiatoday": SiteRule(
        title_selectors=["h1#newsTitle", "h1.news_title", "h1"],
        content_selectors=["#newsBody", ".article_view", ".article_text"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
    # JTBC
    "jtbc": SiteRule(
        title_selectors=["h1#article_title", "h1.title", "h1"],
        content_selectors=["#article_body", ".article_content", ".article_content p"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
    # MBC
    "mbc": SiteRule(
        title_selectors=["h2.news_title", "h1#news_title", "h1"],
        content_selectors=["#news_body_area", ".news_txt", ".news_txt p"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
    # YTN
    "ytn": SiteRule(
        title_selectors=["h1#cm-title", "h1.tit", "h1"],
        content_selectors=["#CmAdContent", ".article_paragraph", "#artibody"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
    # The Korea Times (EN)
    "koreatimes": SiteRule(
        title_selectors=["h1.top-title", "h1#title", "h1"],
        content_selectors=["#articleBody", ".artText", ".artText p"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
    # The Korea Herald (EN)
    "koreaherald": SiteRule(
        title_selectors=["h1#articleTitle", "h1.view_title", "h1"],
        content_selectors=["#articleText", ".view_con", ".article_view"],
        date_meta_props=["article:published_time", "og:article:published_time"],
        image_meta_props=["og:image"],
    ),
}


def get_site_rule(key: str) -> Optional[SiteRule]:
    return RULES.get(key)

