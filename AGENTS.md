# Repository Guidelines

## Project Structure & Module Organization
- Use a simple, predictable layout:
  - `src/` – application code (modules by feature or layer)
  - `tests/` – automated tests mirroring `src/` paths
  - `scripts/` – developer utilities (setup, data, release)
  - `assets/` – static files (images, data fixtures)
  - `docs/` – design notes and ADRs
- New modules should be small, cohesive, and named by domain (e.g., `src/feed/`, `src/search/`).

## Build, Test, and Development Commands
- Prefer a Makefile (or Justfile) as a single entrypoint:
  - `make setup` – install dependencies
  - `make dev` – run the app locally (hot reload if supported)
  - `make test` – run unit/integration tests
  - `make lint` – format and lint
  - `make build` – create a production build or package
- If no Makefile exists, use the stack tools directly (examples): `npm test`, `pytest -q`, `go test ./...`.

## Coding Style & Naming Conventions
- General: keep functions short, choose clear names, prefer composition over inheritance.
- Filenames: `kebab-case` for web assets, `snake_case` for Python, `camelCase` for variables, `PascalCase` for types/classes.
- Formatting/Linting (adopt per stack):
  - JS/TS: Prettier + ESLint
  - Python: Black + ruff
  - Go: `gofmt` + `golangci-lint`
- Commit or configure formatters so `make lint` is deterministic.

## Testing Guidelines
- Put tests in `tests/` mirroring `src/` structure.
- Names: Python `test_*.py`; JS/TS `*.spec.ts` or `*.test.ts`.
- Aim for ≥80% coverage on changed lines; write tests for bug fixes.
- Run locally with `make test` (or stack tool), add focused tests for new behavior.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat: add feed parser`, `fix: handle 429 errors`).
- PRs should include: clear description, linked issues, screenshots/logs when relevant, and test notes.
- Keep PRs small and focused; split refactors from feature changes.

## Security & Configuration
- Never commit secrets; use `.env` and provide `.env.example`.
- Validate untrusted input; log safely; prefer least-privileged keys.
- Add pre-commit hooks to run `lint` and `test` on staged changes.

## Agent-Specific Instructions
- Follow this AGENTS.md for all files in this repo.
- Make minimal, surgical changes; update docs/tests with code changes.
- Before handing off, run `make lint` and `make test` or the closest equivalents.
