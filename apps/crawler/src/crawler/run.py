from __future__ import annotations

import argparse
from typing import Optional

from .sites import SITES
from .fetchers import fetch_site


def fetch_site_once(site_key: str, *, limit: int = 100) -> int:
    cfg = SITES[site_key]
    return fetch_site(cfg, limit=limit, site_key=site_key)


def main(argv: Optional[list[str]] = None) -> int:
    p = argparse.ArgumentParser(description="Fetch news via RSS and persist to DB")
    p.add_argument("--site", choices=SITES.keys(), help="Specific site to fetch (default: all)", default=None)
    p.add_argument("--limit", type=int, default=100, help="Max items per site")
    args = p.parse_args(argv)

    total = 0
    if args.site:
        total += fetch_site_once(args.site, limit=args.limit)
    else:
        for key in SITES.keys():
            total += fetch_site_once(key, limit=args.limit)
    print(f"Saved {total} articles")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
