.PHONY: help setup dev test lint build \
backend-setup backend-dev backend-dev-https backend-test backend-lint backend-build \
web-setup web-dev web-test web-lint web-build \
crawler-setup crawler-run \
compose-backend-up compose-backend-down compose-web-up compose-web-down compose-airflow-init compose-airflow-up compose-airflow-down \
compose-db-up compose-db-down

help:
	@echo "Make targets:"
	@echo "  setup                Install all deps (backend, web, crawler)"
	@echo "  dev                  Run backend locally (use 'web-dev' for FE)"
	@echo "  backend-dev-https    Run backend locally with HTTPS (mkcert)"
	@echo "  test                 Run backend tests"
	@echo "  lint                 Lint/format backend and web"
	@echo "  build                Build backend and web"
	@echo "  compose-*-up/down    Split compose: backend/web/airflow"
	@echo "  crawler-setup/run    Crawler deps / run CLI"
    @echo "  (snapshot/rollback removed)"

setup: backend-setup web-setup crawler-setup ## Install all dependencies

dev: backend-dev ## Run backend locally

test: backend-test ## Run tests

lint: backend-lint web-lint ## Format and lint

build: backend-build web-build ## Build/package

backend-setup:
	$(MAKE) -C apps/backend setup

backend-dev:
	$(MAKE) -C apps/backend dev

backend-dev-https:
	$(MAKE) -C apps/backend dev-https

backend-test:
	$(MAKE) -C apps/backend test

backend-lint:
	$(MAKE) -C apps/backend lint

backend-build:
	$(MAKE) -C apps/backend build

web-setup:
	$(MAKE) -C apps/web setup

web-dev:
	$(MAKE) -C apps/web dev

web-test:
	$(MAKE) -C apps/web test

web-lint:
	$(MAKE) -C apps/web lint

web-build:
	$(MAKE) -C apps/web build

# Crawler (Airflow/CLI)
.PHONY: crawler-setup crawler-run

crawler-setup:
	pip install -r apps/crawler/requirements.txt

crawler-run:
	python -m crawler.run --limit 100

# Split compose (method 1)
.PHONY: compose-backend-up compose-backend-down compose-web-up compose-web-down compose-airflow-init compose-airflow-up compose-airflow-down

compose-backend-up:
	docker compose -f docker-compose.backend.yml up -d --build

compose-backend-down:
	docker compose -f docker-compose.backend.yml down -v

compose-web-up:
	docker compose -f docker-compose.web.yml up -d --build

compose-web-down:
	docker compose -f docker-compose.web.yml down -v

compose-airflow-init:
	docker compose -f docker-compose.airflow.yml up airflow-init --build --exit-code-from airflow-init

compose-airflow-up:
	docker compose -f docker-compose.airflow.yml up -d --build --force-recreate airflow-scheduler airflow-webserver airflow-db

compose-airflow-down:
	docker compose -f docker-compose.airflow.yml down -v

.PHONY: compose-airflow-logs
compose-airflow-logs:
	docker compose -f docker-compose.airflow.yml logs -f airflow-webserver airflow-scheduler

compose-db-up:
	docker compose -f docker-compose.db.yml up -d --build

compose-db-down:
	docker compose -f docker-compose.db.yml down -v

.PHONY: compose-kafka-up compose-kafka-down kafka-topic-create
compose-kafka-up:
	docker network create news_net 2>/dev/null || true
	docker compose -f docker-compose.kafka.yml up -d --build

compose-kafka-down:
	docker compose -f docker-compose.kafka.yml down -v

kafka-topic-create:
	@echo "Kafka auto-creates topics on first produce. To create manually (Bitnami, KRaft):"
	@echo "  docker exec -it news_kafka /opt/bitnami/kafka/bin/kafka-topics.sh --create --topic $${TOPIC:-news_events} --bootstrap-server localhost:9092 --replication-factor 1 --partitions 3 || true"

.PHONY: compose-net-init
compose-net-init:
	docker network create news_net 2>/dev/null || true
