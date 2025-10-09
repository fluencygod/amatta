.PHONY: setup dev test lint build

PYTHON ?= python3
PIP ?= pip3

setup: ## Install backend dependencies
	$(PIP) install -r requirements.txt

dev: ## Run FastAPI app with reload
	PYTHONPATH=./src uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test: ## Run backend tests
	PYTHONPATH=./src pytest -q

lint: ## Format and lint
	black src tests
	ruff check src tests --fix

build: ## Placeholder for packaging
	@echo "No build step defined for backend."

.PHONY: migrate upgrade downgrade revision
migrate: ## Apply latest DB migrations
	PYTHONPATH=./src alembic upgrade head

upgrade: migrate

downgrade: ## Downgrade one migration
	PYTHONPATH=./src alembic downgrade -1

revision: ## Create new auto migration (msg=...)
	PYTHONPATH=./src alembic revision --autogenerate -m "$(msg)"
