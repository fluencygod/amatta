from __future__ import annotations

import os
from datetime import datetime, timedelta

from airflow import DAG
from airflow.decorators import task


default_args = {
    "owner": "news",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}


SITE_KEYS = os.getenv(
    "CRAWLER_SITE_KEYS",
    "khan,mk,donga,hankook,asiatoday,jtbc,mbc,ytn,koreatimes,koreaherald",
).split(",")


with DAG(
    dag_id="news_crawl_daily",
    description="Fetch ~100 articles per KR publisher and store in DB",
    default_args=default_args,
    schedule_interval="0 3 * * *",  # daily 03:00 KST-ish (adjust TZ separately)
    start_date=datetime(2025, 1, 1),
    catchup=False,
) as dag:

    @task
    def crawl_site(site_key: str):
        limit = int(os.getenv("CRAWLER_DAILY_LIMIT", "100"))
        # Import at runtime to avoid DAG parse-time import errors
        from crawler.run import fetch_site_once  # type: ignore

        fetch_site_once(site_key, limit=limit)

    # Create one task per site
    for key in [k.strip() for k in SITE_KEYS if k.strip()]:
        crawl_site.override(task_id=f"crawl_{key}")(key)
