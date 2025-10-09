# Monorepo: News

This monorepo contains a FastAPI backend and a React (Vite) web app. Structure follows the repo guidelines: each app has `src/`, `tests/`, `scripts/`, etc.

## Structure

- `apps/backend/` – FastAPI app (MariaDB) with auth, Alembic, Dockerfile
- `apps/web/` – Vite + React app
- `Makefile` – root entrypoint that proxies to backend
 - `docker-compose.yml` – MariaDB + backend services

## Commands

- `make setup` – install dependencies for all apps
- `make dev` – run backend locally
- `make test` – run tests
- `make lint` – format and lint

See `apps/backend/README.md` and `apps/web/README.md` for details.

## Docker Compose

- Copy `.env.example` to `.env`
- Start services: `make compose-up` (db + backend + web)
- Stop and remove: `make compose-down`
- Tail logs: `make compose-logs`

Services:
- Backend: http://localhost:8000
- Web: http://localhost:8080

## Git Snapshots (Rollback)

- Create snapshot commit + tag: `make snapshot` or `make snapshot TAG=my-snap`
- Roll back to a tag: `make rollback TAG=<tag>`

The helper scripts only commit files under `news/` to keep the outer repo clean.
