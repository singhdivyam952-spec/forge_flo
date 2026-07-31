# Deployment Guide

Forge Flo Manufacturing ERP ships with a Docker-based deployment path
(`docker-compose.yml` + per-package `Dockerfile`s) as well as instructions
for running the pieces manually (e.g. on a VM or split across managed
services).

## 1. Prerequisites

- Docker & Docker Compose (recommended), **or**
- Node.js >= 20, npm >= 10, and a reachable MongoDB 7.x instance

## 2. Configuration

Copy the example env files and fill in real secrets before deploying to any
shared environment:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Key backend variables (see `backend/src/config/env.ts` for the full,
validated list):

| Variable               | Purpose                                              |
| ------------------------ | ------------------------------------------------------ |
| `NODE_ENV`                | `development` \| `test` \| `production`                 |
| `PORT`                    | HTTP port (default `5000`)                                |
| `MONGODB_URI`              | MongoDB connection string                                   |
| `CLIENT_URL`               | Allowed CORS origin for the frontend                          |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | **Must** be ≥ 32 chars, unique per environment |
| `COOKIE_SECRET`             | **Must** be ≥ 16 chars                                          |
| `STORAGE_TYPE`              | `local` or `s3` (see `AWS_*` vars when using `s3`)                |
| `SMTP_*`                     | Outbound email (password reset, notifications)                     |
| `COMPANY_NAME` / `COMPANY_CODE` | Seeded into `Settings` on first run                              |

> ⚠️ **Never deploy with the default secrets from `.env.example`.**
> Generate strong random values, e.g. `openssl rand -base64 48`.

## 3. Docker Compose (recommended)

The provided `docker-compose.yml` builds and runs three containers:
`mongodb`, `backend`, and `frontend` (served via Nginx).

```bash
# from the repo root
docker compose up -d --build

# tail logs
docker compose logs -f backend

# stop everything
docker compose down
```

- Backend is published on `http://localhost:5000` (API at `/api/v1`, docs
  at `/api-docs`).
- Frontend is published on `http://localhost:5173`.
- MongoDB data persists in the `mongo_data` named volume; uploaded files
  persist in `upload_data`.

Override the JWT secrets for a real deployment:

```bash
JWT_ACCESS_SECRET="$(openssl rand -base64 48)" \
JWT_REFRESH_SECRET="$(openssl rand -base64 48)" \
docker compose up -d --build
```

### Seeding inside Docker

```bash
docker compose exec backend node -e "require('tsx/cjs')" 2>/dev/null; \
docker compose exec backend npx tsx src/seeds/index.ts
```

(or simply run `npm run seed -w backend` locally against the same
`MONGODB_URI` the container uses, before switching `NODE_ENV` to
`production`).

## 4. Manual / VM deployment

```bash
# 1. Install dependencies (installs all three workspaces)
npm install

# 2. Build shared -> backend -> frontend
npm run build

# 3. (Optional, first deploy only) seed demo/reference data
npm run seed -w backend

# 4. Start the API
npm run start -w backend
# serves dist/server.js on $PORT, connects to $MONGODB_URI

# 5. Serve the frontend build (frontend/dist) from any static host / Nginx / CDN
```

A process manager (PM2, systemd, or your container orchestrator's
restart policy) should supervise `npm run start -w backend` in
production so it restarts automatically on crash. The app already
handles `SIGTERM`/`SIGINT` for graceful shutdown (`backend/src/server.ts`).

## 5. Database

- MongoDB 7.x is expected (see `docker-compose.yml`). Replica set is
  **not required** to run the app, but is required to use MongoDB
  multi-document transactions used by `StockService.withTransaction`
  (GRN posting, material issue posting, etc.). For production, run
  MongoDB as at least a single-node replica set, or use MongoDB Atlas.
- Indexes are created automatically on connect in non-test environments
  (`autoIndex: !isTest` in `backend/src/config/database.ts`). For very
  large production datasets, consider building indexes out-of-band
  (`autoIndex: false` + a manual `syncIndexes()` migration step).
- Back up the `manufacturing_erp` database regularly — `StockLedger` is
  the append-only source of truth for all inventory movements.

## 6. Reverse proxy / TLS

Terminate TLS at your load balancer/reverse proxy (Nginx, Caddy, ALB,
Cloudflare, etc.) and forward:

- `/` → frontend container/static bundle
- `/api/v1/*`, `/api-docs`, `/uploads/*` → backend container on port `5000`

Make sure `CLIENT_URL` (backend) and the frontend's API base URL
(`frontend/.env`) match your public domains, or CORS/cookies will fail.

## 7. Health checks

- `GET /api/v1/health` — lightweight liveness probe (used by the Docker
  `HEALTHCHECK` in `backend/Dockerfile`).
- `GET /api/v1/auth/me` (with a valid token) — good smoke test for full
  auth + DB connectivity after a deploy.

## 8. Rolling out schema/model changes

This project uses Mongoose without a dedicated migration framework.
When adding required fields or changing enums on existing models:

1. Ship the model change as backwards-compatible first (optional field
   with a sensible default).
2. Backfill existing documents with a one-off script under
   `backend/src/seeds/` or a scratch script using the same `models/`.
3. Only tighten validation (`required: true`, enum restrictions) once
   the backfill has run in production.
