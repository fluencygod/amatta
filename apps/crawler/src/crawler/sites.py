from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class SiteConfig:
    name: str
    rss: List[str]
    homepage: str


# Note: RSS endpoints are used to respect crawling policies. Adjust per-site as needed.
SITES: Dict[str, SiteConfig] = {
    # 1) 경향신문 (Kyunghyang)
    "khan": SiteConfig(
        name="Kyunghyang Shinmun",
        homepage="https://www.khan.co.kr",
        rss=["https://www.khan.co.kr/rss/rssdata/total_news.xml"],
    ),
    # 2) 매일경제 (Maeil Business)
    "mk": SiteConfig(
        name="Maeil Business",
        homepage="https://www.mk.co.kr",
        rss=[
            "https://www.mk.co.kr/rss/30000001/",  # 종합
        ],
    ),
    # 3) 동아일보 (Donga)
    "donga": SiteConfig(
        name="Donga Ilbo",
        homepage="https://www.donga.com",
        rss=["https://www.donga.com/news/rss"],
    ),
    # 4) 한국일보 (Hankook Ilbo)
    "hankook": SiteConfig(
        name="Hankook Ilbo",
        homepage="https://www.hankookilbo.com",
        rss=["https://www.hankookilbo.com/rss"]
    ),
    # 5) 아시아투데이 (AsiaToday)
    "asiatoday": SiteConfig(
        name="AsiaToday",
        homepage="https://www.asiatoday.co.kr",
        rss=["https://www.asiatoday.co.kr/rss/all.xml"],
    ),
    # 6) JTBC News
    "jtbc": SiteConfig(
        name="JTBC News",
        homepage="https://news.jtbc.co.kr",
        rss=[
            "https://fs.jtbc.co.kr/RSS/newsflash.xml",
        ],
    ),
    # 7) MBC News
    "mbc": SiteConfig(
        name="MBC News",
        homepage="https://imnews.imbc.com",
        rss=["https://imnews.imbc.com/rss/news.xml"],
    ),
    # 8) YTN
    "ytn": SiteConfig(
        name="YTN",
        homepage="https://www.ytn.co.kr",
        rss=["https://www.ytn.co.kr/rss/sitemap.xml"],  # site map style feed; adjust if needed
    ),
    # 9) The Korea Times (EN)
    "koreatimes": SiteConfig(
        name="The Korea Times",
        homepage="https://www.koreatimes.co.kr",
        rss=["https://www.koreatimes.co.kr/www/rss/nation.xml"],
    ),
    # 10) The Korea Herald (EN)
    "koreaherald": SiteConfig(
        name="The Korea Herald",
        homepage="https://www.koreaherald.com",
        rss=["https://www.koreaherald.com/rss/0201.xml"],  # National
    ),
}

