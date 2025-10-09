# Backend (FastAPI)

## Quickstart

- Copy `.env.example` to `.env` and set values.
- Ensure MariaDB is running and the database exists (e.g., `newsdb`). You can use Docker Compose at the repo root: `make compose-up`.

Commands:
- `make setup` – install dependencies
- `make dev` – run server at http://localhost:8000
- `make test` – run tests
- `make lint` – format and lint

## DB Init

Run migrations (preferred): `make migrate`
or create tables once: `PYTHONPATH=./src python scripts/init_db.py`

## Auth API

- POST `/auth/register` – `{ email, password, username? }`
- POST `/auth/login` – `{ email, password }`

`/auth/login` and `/auth/token` return `{ access_token, token_type }`. Use `Authorization: Bearer <token>` to access `/auth/me`.

## CORS

CORS is enabled via FastAPI's `CORSMiddleware`.
- Configure in `.env` using JSON arrays:
  - `CORS_ALLOWED_ORIGINS=["http://localhost:5173"]` (or `["*"]` for any origin)
  - `CORS_ALLOW_CREDENTIALS=true`
  - `CORS_ALLOWED_METHODS=["*"]`
  - `CORS_ALLOWED_HEADERS=["*"]`

## Testing

`make test` runs with an in-memory SQLite database.
