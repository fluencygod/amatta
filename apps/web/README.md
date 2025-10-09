# Web (Vite + React)

## Quickstart

- `make setup` – install dependencies
- `make dev` – run dev server at http://localhost:5173
- Proxy to backend is configured for `/auth` → http://localhost:8000

## Minimal Auth Demo

- Register/Login using the form
- Fetch `/auth/me` with bearer token

Adjust API base or proxy as needed for your environment.

## Docker Compose

- The web app is served at http://localhost:8080 via Nginx.
- API base is injected at build time using `VITE_API_BASE` (defaults to `http://localhost:8000`).
