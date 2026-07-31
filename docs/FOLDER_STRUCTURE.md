# Folder Structure

Forge Flo Manufacturing ERP is an npm-workspaces monorepo with three
packages: `backend` (Express/TypeScript/MongoDB API), `frontend`
(React/Vite SPA), and `shared` (types/constants shared by both).

```
forge_flo/
├── package.json                # Root workspace manifest (backend, frontend, shared)
├── docker-compose.yml           # Local orchestration (Mongo + backend + frontend)
├── README.md                    # Install guide, demo accounts, quick start
├── docs/                        # Architecture & operational documentation
│   ├── ER_DIAGRAM.md
│   ├── FOLDER_STRUCTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── shared/                      # @manufacturing-erp/shared — cross-package code
│   ├── package.json
│   └── src/
│       └── index.ts             # Shared constants/types (e.g. APP_NAME)
│
├── backend/                     # Express + TypeScript + MongoDB API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env / .env.example
│   └── src/
│       ├── server.ts            # Process entrypoint — connects DB, starts HTTP + sockets
│       ├── app.ts                # Express app factory (middleware, routers, error handling)
│       ├── config/               # env, database, logger, storage, swagger setup
│       ├── constants/            # UserRole, PERMISSIONS, enums shared across the domain
│       ├── models/                # Mongoose schemas — one file per entity (~50 models)
│       │   └── common/            # Shared sub-schemas (address, contact, audit fields)
│       ├── repositories/          # Generic BaseRepository + entity-specific repos
│       ├── services/              # Business logic (StockService, ProductionOrderService, ...)
│       ├── controllers/           # Thin request handlers (mainly Auth)
│       ├── routes/                # Express routers
│       │   ├── index.ts           # Mounts /health, /auth, and all module routers
│       │   ├── modules.ts         # Generic CRUD module + specialized business routers
│       │   ├── auth.routes.ts
│       │   └── system.routes.ts
│       ├── middleware/            # auth, rbac, validate, rateLimiter, audit, upload, errorHandler
│       ├── validators/            # Zod request-body schemas
│       ├── utils/                 # AppError, apiResponse, documentNumber, password, pdf, excel, ...
│       ├── sockets/                # Socket.IO server (real-time shop-floor/notification events)
│       ├── seeds/                 # Database seed script (see below)
│       │   └── index.ts
│       ├── types/                 # Ambient/express type augmentation
│       └── tests/
│           ├── unit/               # Fast, isolated unit tests (e.g. appError.test.ts)
│           └── integration/        # API/integration tests (supertest + mongodb-memory-server)
│
└── frontend/                    # React 19 + Vite + MUI SPA
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx               # React root
        ├── theme/                 # MUI theme configuration
        ├── config/                 # Runtime config (API base URL, etc.)
        ├── constants/               # Frontend-side enums/constants
        ├── api/                    # Axios client + API call modules
        ├── contexts/                # React context providers (auth, notifications)
        ├── hooks/                   # Custom hooks (react-query wrappers, etc.)
        ├── routes/                  # react-router route definitions
        ├── layouts/                 # App shell / dashboard layout
        ├── pages/                   # Route-level pages (DashboardPage, ProductionOrdersPage, ...)
        ├── components/
        │   ├── common/               # Buttons, tables, dialogs, etc.
        │   ├── forms/                # Reusable form fields
        │   ├── layout/               # Navbar, sidebar, etc.
        │   └── charts/                # Recharts wrappers
        ├── types/                   # Shared frontend TS types (mirrors backend API shapes)
        └── styles/                  # Global CSS
```

## Key conventions

- **Models** (`backend/src/models/*.ts`) always export both the Mongoose
  `Model` and its `I<Name>` interface, and re-export through
  `backend/src/models/index.ts` so call sites do `import { Material } from
  '../models'` rather than reaching into individual files.
- **Master data** models (Warehouse, Material, Customer, Supplier, Machine,
  WorkCenter, Shift, BOM, Routing, ...) share `auditedSoftDeleteFields`
  (`createdBy`/`updatedBy`/`isDeleted`/`deletedAt`/`deletedBy`) from
  `models/common/schema.helpers.ts`.
- **Document-driven modules** (Sales Orders, Production Orders, GRNs, ...)
  get a human-readable, sequential number via
  `utils/documentNumber.ts#generateDocumentNumber`, backed by the `Counter`
  model.
- **Routes** are split into generic CRUD modules (`routes/modules.ts ->
  buildModuleRouters`) for straightforward masters, and specialized routers
  (`buildSpecialRouters`) for endpoints with real business logic (stock
  posting, production order lifecycle, scrap disposal, etc.).
- **The seed script** (`backend/src/seeds/index.ts`) is the fastest way to
  understand how all of the above fit together end-to-end — it walks
  through master data → engineering (BOM/Routing) → opening stock →
  Sales Order → Production Order → Material Issue → Scrap.
