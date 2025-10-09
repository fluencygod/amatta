News Crawler (Airflow + CLI)

Overview
- Daily pipeline to fetch up to 100 articles per site from 10 KR publishers that expose crawlable endpoints (primarily RSS), and persist into the database.
- Managed via Apache Airflow DAG or a simple CLI for local/manual runs.

Directories
- dags/ — Airflow DAGs (news_crawl_daily.py)
- src/crawler/ — Reusable crawler package (DB models, fetchers, site configs)

Requirements
- Python 3.11+
- Database: uses the same DB type as backend (default MySQL/MariaDB). Configure via env.

Environment
- Create a .env (or export env vars):
  - CRAWLER_DATABASE_URL=mysql+pymysql://user:password@localhost:3306/newsdb
  - CRAWLER_USER_AGENT=news-crawler/1.0 (+https://example.com)
  - CRAWLER_DAILY_LIMIT=100
  - CRAWLER_REQUEST_DELAY=0.3         # base delay seconds between items
  - CRAWLER_REQUEST_JITTER=0.25       # random jitter added to delay

Install
  pip install -r apps/crawler/requirements.txt
  export PYTHONPATH=$(pwd)/apps/crawler/src:$PYTHONPATH

CLI (manual run)
  python -m crawler.run --limit 100

Airflow (outline)
- Point AIRFLOW_HOME to apps/crawler and add dags/ to DAGs folder, then run Airflow webserver/scheduler as you usually do.
- DAG id: news_crawl_daily (daily schedule, parallel site tasks)
 - Ensure PYTHONPATH includes apps/crawler/src so the DAG can import crawler.*

Notes
- 기본은 RSS(정책 친화적)로 목록을 가져오고, 사이트별 규칙(rule)로 기사 페이지 HTML에서 제목/본문/이미지/발행일을 보강 추출합니다.
- 규칙 파일: `src/crawler/rules.py` — 언론사별 CSS 셀렉터/메타 태그 맵핑
- robots.txt 및 약관 준수: 트래픽 슬로틀(지연/지터), User-Agent, 요청 제한은 환경변수로 조정하세요.
