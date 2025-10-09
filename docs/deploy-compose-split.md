Deploy: Split docker-compose per service (방법 1)

Goal
- web, backend, airflow를 각각 다른 서버(혹은 실행 환경)에서 독립적으로 운영합니다.

Files
- docker-compose.backend.yml — FastAPI backend only (DB는 외부 주소로 연결)
- docker-compose.web.yml — Vite build된 web 서버 (백엔드 API 주소 필요)
- docker-compose.airflow.yml — Airflow(web/scheduler + Postgres 메타DB)

Prereqs
- .env 파일에 아래 항목 준비(서버별로 적절히 값 변경):
  - BACKEND 서버: DATABASE_URL, JWT_* 등
  - WEB 서버: VITE_API_BASE (백엔드의 공개 URL)
  - AIRFLOW 서버: CRAWLER_DATABASE_URL, CRAWLER_USER_AGENT, CRAWLER_DAILY_LIMIT, AIRFLOW_USERNAME/PASSWORD/EMAIL

Backend server
  # 공용 네트워크를 한 번 생성 (서버별 1회)
  docker network create news_net || true
  # DB 서버를 먼저 올리고(또는 외부 DB 사용 시 건너뜀), 백엔드는 같은 네트워크로 올립니다.
  docker compose -f docker-compose.backend.yml up -d --build
  # 포트 8000 → http://<backend-host>:8000

Web server
  export VITE_API_BASE=https://<backend-host-or-domain>:8000
  docker compose -f docker-compose.web.yml up -d --build
  # 포트 8080 → http://<web-host>:8080

Airflow server
  export CRAWLER_DATABASE_URL=mysql+pymysql://user:password@<db-host>:3306/newsdb
  export CRAWLER_USER_AGENT="news-crawler/1.0 (+https://yourdomain.example)"
  export CRAWLER_DAILY_LIMIT=100
  # 초기화(최초 1회)
  docker compose -f docker-compose.airflow.yml up airflow-init --build --exit-code-from airflow-init
  # 기동
  docker compose -f docker-compose.airflow.yml up -d --build airflow-db airflow-scheduler airflow-webserver
  # 접속: http://<airflow-host>:8081  (admin/admin 기본값 — .env에서 변경 권장)

Notes
- Airflow 컨테이너는 apps/crawler/dags와 apps/crawler/src를 마운트하여 DAG와 크롤러 코드를 로딩합니다.
- Airflow는 자체 메타 DB(Postgres)를 사용하며, 실제 기사 저장은 CRAWLER_DATABASE_URL의 메인 DB를 사용합니다.
- 보안: 서버 간 통신은 방화벽/보안그룹으로 포트 제한하고, DB는 내부망 또는 SSL/TLS 사용을 권장합니다.
- 스케일아웃: 각 서버에서 해당 compose 파일만 운영하면 독립 배포가 가능합니다.
- 분리된 compose 간 서비스 이름으로 접근하려면 동일한 외부 네트워크(news_net)를 사용해야 합니다. 이 가이드의 compose 파일은 기본 네트워크를 news_net(external)으로 지정했으므로 최초에 `docker network create news_net`이 필요합니다.
