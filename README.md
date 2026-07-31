# Forge Flo — Manufacturing ERP

A production-ready Manufacturing ERP for metal machining companies, built as
an npm-workspaces monorepo:

- **`backend/`** — Express + TypeScript + MongoDB REST API (JWT auth, RBAC,
  ~50 domain models covering sales, engineering, production, quality,
  inventory, procurement and dispatch)
- **`frontend/`** — React 19 + Vite + MUI single-page application
- **`shared/`** — `@manufacturing-erp/shared`, code shared between the two

See [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) for a full tour
of the codebase, [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) for the core
data model, [`docs/API.md`](docs/API.md) for the endpoint reference, and
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for deployment instructions.

## Features

- JWT access/refresh authentication with per-role RBAC permissions
  (`users`, `production`, `inventory`, `quality`, `sales`, `purchase`, ...)
- End-to-end material traceability: Sales Order → Production Order (BOM +
  Routing) → Material Issue → Consumption/Scrap, all posted through an
  immutable `StockLedger` with batch/heat/lot tracking
- Master data for warehouses, materials, customers, suppliers, machines,
  work centers and shifts
- Quality workflows (Inspections, NCR, CAPA, Rework), special processes
  (Heat Treatment, Outsourcing), and dispatch (Packing, Dispatch)
- Swagger/OpenAPI docs, audit logging, rate limiting, file uploads (local
  or S3), and a real-time Socket.IO layer for shop-floor updates

## Prerequisites

- Node.js **>= 20**
- npm **>= 10**
- MongoDB **7.x** (local install, Docker, or MongoDB Atlas)

## Quick start (local, without Docker)

```bash
# 1. Clone and install all workspace dependencies
git clone <this-repo>
cd forge_flo
npm install

# 2. Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env if your MongoDB isn't on the default local port,
# and set real JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / COOKIE_SECRET values.

# 3. Make sure MongoDB is running, e.g.:
docker run -d --name erp-mongo -p 27017:27017 mongo:7

# 4. Seed the database with demo/reference data
npm run seed -w backend

# 5. Start backend + frontend together
npm run dev
```

- API: `http://localhost:5000` (routes under `/api/v1`, Swagger UI at
  `/api-docs`)
- Frontend: `http://localhost:5173`

To run just one side: `npm run dev:backend` or `npm run dev:frontend`.

## Quick start (Docker Compose)

```bash
docker compose up -d --build
npm run seed -w backend   # optional — seed against the containerized MongoDB
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full details, including
production secret management and manual/VM deployment.

## Demo accounts

Running `npm run seed -w backend` creates the following users (all with
email domain `@forgeflo.local`). **Change or remove these before deploying
to a real environment.**

| Role       | Email                          | Password     | Employee Code |
| ---------- | ------------------------------- | ------------- | --------------- |
| Admin       | `admin@forgeflo.local`            | `Admin@123`     | `EMP001`         |
| PPC         | `ppc@forgeflo.local`               | `Ppc@12345`     | `EMP002`         |
| Store       | `store@forgeflo.local`             | `Store@123`     | `EMP003`         |
| Production  | `production@forgeflo.local`         | `Prod@1234`     | `EMP004`         |
| Quality     | `quality@forgeflo.local`             | `Quality@1`     | `EMP005`         |
| Sales       | `sales@forgeflo.local`                 | `Sales@123`     | `EMP006`         |
| Purchase    | `purchase@forgeflo.local`               | `Purch@123`     | `EMP007`         |

Log in via `POST /api/v1/auth/login` or the frontend login screen at
`http://localhost:5173`.

### What gets seeded

Besides the users/roles above, the seed script (`backend/src/seeds/index.ts`)
creates a fully connected demo dataset so you can explore the app
immediately:

- **Company settings** for "Forge Flo Manufacturing" (`FFM`)
- **Warehouses**: `RM-MAIN`, `FG-MAIN`, `SCRAP-01`, `WIP-01` (each with racks `R01`/`R02`)
- **Materials**: `RM-MS-BAR-25` (batch + heat tracked, FIFO), `RM-MS-PLT-10`
  (Average costed), `FG-SHAFT-001` (finished good), `SCRAP-MS-TURNING`
- **Customers**: `CUST-001` Acme Auto, `CUST-002` Bharat Heavy
- **Suppliers**: `SUP-001` Steel India, `SUP-002` Alloy Traders
- **Work centers/machines/shifts**: `WC-CNC`, `WC-GRIND`; `CNC-L1`, `CNC-M1`,
  `GRIND-1`; Shifts `A`/`B`/`C`
- **Engineering**: a BOM and Routing for `FG-SHAFT-001` (CNC Turning →
  Grinding → Inspection)
- **Opening stock**: 1000 KG each of the raw materials in `RM-MAIN`, with
  batch/heat numbers and matching `StockLedger` opening entries
- **A live transaction chain**: Sales Order `SO-2026-0001` → Production
  Order `PRD-2026-0001` (Released) → Material Issue `MI-2026-0001` →
  Scrap `SCR-2026-0001`

Re-running `npm run seed -w backend` is safe: outside of `production` it
wipes and recreates the collections above; in `production` it upserts
master data instead of duplicating it.

## Scripts

| Command                     | Description                                      |
| ----------------------------- | --------------------------------------------------- |
| `npm run dev`                    | Run backend + frontend concurrently                    |
| `npm run dev:backend`              | Run only the backend (`tsx watch`)                       |
| `npm run dev:frontend`              | Run only the frontend (Vite dev server)                    |
| `npm run build`                       | Build `shared` → `backend` → `frontend`                       |
| `npm run seed -w backend`               | Seed the database with demo data                                |
| `npm run test`                            | Run backend tests (Vitest)                                         |
| `npm run docker:up` / `docker:down`         | Start/stop the Docker Compose stack                                    |

Backend-specific (`cd backend`): `npm run lint`, `npm run typecheck`,
`npm run test:watch`.

## Testing

```bash
cd backend
npm run test         # one-shot (vitest run)
npm run test:watch   # watch mode
```

Unit tests live under `backend/src/tests/unit/` (e.g.
`appError.test.ts`), integration tests under `backend/src/tests/integration/`.

## Project documentation

- [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) — core material-tracking data model (Mermaid ER diagram)
- [`docs/FOLDER_STRUCTURE.md`](docs/FOLDER_STRUCTURE.md) — repository layout and conventions
- [`docs/API.md`](docs/API.md) — key REST endpoints and permissions
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Docker Compose and manual deployment guide

## License

Proprietary — internal use only unless stated otherwise by the project owner.
