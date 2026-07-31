# API Reference

Base URL: `http://localhost:5000/api/v1` (see `API_URL`/`PORT` in `.env`).
Interactive Swagger UI is served at `http://localhost:5000/api-docs`.

All responses follow a consistent envelope:

```jsonc
// Success
{ "success": true, "message": "Success", "data": { /* ... */ }, "meta": { /* pagination, optional */ } }

// Error
{ "success": false, "message": "Resource not found", "errorCode": "NOT_FOUND", "errors": { /* optional */ } }
```

Authenticated endpoints require `Authorization: Bearer <accessToken>`.
Most module endpoints additionally require an RBAC permission of the form
`<module>:<action>` (e.g. `production:approve`) — see
`backend/src/constants/index.ts` for the full permission catalog and
`DEFAULT_ROLE_PERMISSIONS` for what each seeded role gets by default.

## Health

| Method | Path      | Auth | Description                     |
| ------ | --------- | ---- | -------------------------------- |
| GET    | `/health` | none | Liveness/readiness check         |

## Authentication (`/auth`)

| Method | Path                     | Auth       | Description                                  |
| ------ | ------------------------ | ---------- | --------------------------------------------- |
| POST   | `/auth/register`          | none       | Create a new user account                     |
| POST   | `/auth/login`              | none       | Log in with email + password, returns tokens  |
| POST   | `/auth/refresh`            | none       | Exchange a refresh token for a new access token |
| POST   | `/auth/logout`              | Bearer     | Revoke the current session's refresh token     |
| POST   | `/auth/logout-all`          | Bearer     | Revoke all of the user's sessions              |
| POST   | `/auth/change-password`     | Bearer     | Change the current user's password             |
| GET    | `/auth/me`                  | Bearer     | Get the current authenticated user's profile   |

## Master data (generic CRUD)

Every master data resource below exposes the same generic CRUD surface
(`routes/modules.ts#master`): `GET /`, `GET /:id`, `POST /`, `PUT /:id`,
`DELETE /:id`, with pagination (`page`, `limit`), search (`search`) and
per-module filters (`filterKeys`).

| Path                     | Permission prefix | Notes                                             |
| ------------------------ | ------------------ | -------------------------------------------------- |
| `/users`                  | `users`             | filter by `role`, `isActive`, `department`         |
| `/roles`                  | `roles`             | permission bundles                                 |
| `/customers`              | `customers`         | filter by `customerType`, `isActive`, `category`   |
| `/suppliers`              | `suppliers`         | filter by `isActive`                                |
| `/materials`              | `materials`         | filter by `type`, `isActive`, `category`, `valuationMethod` |
| `/warehouses`             | `inventory`         | filter by `type`, `isActive`                        |
| `/machines`               | `maintenance`       | filter by `status`, `isActive`, `workCenter`         |
| `/work-centers`           | `production`        |                                                     |
| `/shifts`                 | `production`        |                                                     |
| `/boms`                   | `engineering`       | filter by `status`, `finishedMaterial`               |
| `/routings`               | `engineering`       | filter by `status`, `finishedMaterial`               |
| `/drawings`               | `engineering`       | auto document number `DWG-YYYY-####`                |
| `/npd`                    | `engineering`       | auto document number `NPD-YYYY-####`                |
| `/engineering-changes`    | `engineering`       | auto document number `ECN-YYYY-####`                |
| `/enquiries`              | `sales`             | auto document number `ENQ-YYYY-####`                |
| `/rfqs`                   | `sales`             | auto document number `RFQ-YYYY-####`                |
| `/cost-estimations`       | `sales`             | auto document number `CE-YYYY-####`                 |
| `/quotations`             | `sales`             | auto document number `QT-YYYY-####`                 |
| `/sales-orders`           | `sales`             | auto document number `SO-YYYY-####`                 |
| `/production-plans`       | `production`        | auto document number `PP-YYYY-####`                 |
| `/material-requisitions`  | `inventory`         | auto document number `MRQ-YYYY-####`                |
| `/machine-allocations`    | `production`        |                                                     |
| `/machine-downtimes`      | `maintenance`       |                                                     |
| `/employee-allocations`   | `production`        |                                                     |
| `/shop-floor`             | `production`        |                                                     |
| `/inspections`            | `quality`           | auto document number `QI-YYYY-####`                 |
| `/ncrs`                   | `quality`           | auto document number `NCR-YYYY-####`                |
| `/capas`                  | `quality`           | auto document number `CAPA-YYYY-####`               |
| `/reworks`                | `quality`           | auto document number `RWK-YYYY-####`                |
| `/heat-treatments`        | `production`        | auto document number `HT-YYYY-####`                 |
| `/outsourcing`            | `purchase`          | auto document number `OS-YYYY-####`                 |
| `/packing`                | `sales`             | auto document number `PKG-YYYY-####`                |
| `/dispatches`             | `sales`             | auto document number `DSP-YYYY-####`                |
| `/purchase-orders`        | `purchase`          | auto document number `PO-YYYY-####`                 |
| `/stock-transfers`        | `inventory`         | auto document number `ST-YYYY-####`                 |
| `/files`                  | `settings`          | uploaded file metadata                              |
| `/approvals`              | `settings`          | generic approval workflow records                   |
| `/notifications`          | `notifications`     | filter by `isRead`, `type`                          |
| `/audit-logs`             | `auditLogs`         | filter by `action`, `entityType`, `user`             |

## Production Orders (`/production-orders`)

| Method | Path                                     | Permission            | Description                                        |
| ------ | ----------------------------------------- | ---------------------- | --------------------------------------------------- |
| GET    | `/production-orders`                       | `production:read`      | List, filterable by `status`                         |
| GET    | `/production-orders/:id`                    | `production:read`      | Get one (populates material, BOM, routing, ops)       |
| GET    | `/production-orders/:id/traceability`        | `production:read`      | Full material genealogy for the order                 |
| POST   | `/production-orders`                          | `production:create`    | Create a new production order                          |
| POST   | `/production-orders/:id/release`               | `production:approve`   | Release a planned order to the shop floor               |
| POST   | `/production-orders/:id/start`                  | `production:update`    | Mark order in-progress                                   |
| POST   | `/production-orders/:id/shop-floor`              | `production:update`    | Log a shop-floor entry (start/stop/qty) against the order |
| POST   | `/production-orders/:id/operations/:seq/complete` | `production:update`  | Complete a specific routing operation                     |
| POST   | `/production-orders/:id/complete`                 | `production:approve`   | Complete the order and receive FG into stock                |
| PUT    | `/production-orders/:id`                            | `production:update`    | Generic field update                                       |

## Material Issues / Returns / Consumption

| Method | Path                        | Permission           | Description                                    |
| ------ | ---------------------------- | ---------------------- | ------------------------------------------------ |
| GET    | `/material-issues`             | `inventory:read`       | List material issues                              |
| GET    | `/material-issues/:id`          | `inventory:read`       | Get one issue                                      |
| POST   | `/material-issues`               | `inventory:create`     | Create a draft material issue                        |
| POST   | `/material-issues/:id/post`       | `inventory:approve`    | Post the issue — decrements stock, writes ledger       |
| GET    | `/material-returns`                | `inventory:read`       | List material returns                                   |
| POST   | `/material-returns`                  | `inventory:create`     | Create + post a return to store in one step               |
| GET    | `/material-consumptions`              | `inventory:read`       | List consumption records, filter by `productionOrder`, `material` |
| POST   | `/material-consumptions`                | `production:update`    | Record consumption against a production order                       |

## Scrap (`/scraps`)

| Method | Path                    | Permission           | Description                                     |
| ------ | ------------------------ | ---------------------- | ------------------------------------------------- |
| GET    | `/scraps/dashboard`         | `production:read`      | Aggregated scrap KPIs for a date range               |
| GET    | `/scraps`                     | `production:read`      | List, filter by `status`, `scrapType`, `productionOrder` |
| POST   | `/scraps`                       | `production:create`    | Record a new scrap entry                               |
| POST   | `/scraps/:id/dispose`             | `production:update`    | Dispose/sell/return scrap to stock                       |

## Inventory (`/inventory`)

| Method | Path                             | Permission           | Description                                 |
| ------ | ---------------------------------- | ---------------------- | ---------------------------------------------- |
| GET    | `/inventory/balances`                 | `inventory:read`       | Stock balances, filter by `material`, `warehouse` |
| GET    | `/inventory/ledger`                     | `inventory:read`       | Paginated stock ledger, filter by material/warehouse/production order/date range |
| GET    | `/inventory/available/:materialId`        | `inventory:read`       | Available (on-hand minus reserved) qty for a material |

## Goods Receipt (`/goods-receipts`)

| Method | Path                        | Permission          | Description                                     |
| ------ | ---------------------------- | --------------------- | ------------------------------------------------ |
| GET    | `/goods-receipts`               | `purchase:read`        | List GRNs                                          |
| GET    | `/goods-receipts/:id`             | `purchase:read`        | Get one GRN                                          |
| POST   | `/goods-receipts`                   | `purchase:create`      | Create a draft GRN (auto-numbered `GRN-YYYY-####`)     |
| POST   | `/goods-receipts/:id/post`            | `purchase:approve`     | Post the GRN — posts stock IN and marks it Accepted    |

## Seed data reference

Run `npm run seed -w backend` to populate demo data (see the root
[README](../README.md) for full demo credentials). This creates one
complete traceability chain you can immediately explore with the endpoints
above:

- `SO-2026-0001` (Sales Order, Confirmed) → `PRD-2026-0001` (Production
  Order, Released, `FG-SHAFT-001` x 100 PCS)
- `MI-2026-0001` (Material Issue, 250 KG of `RM-MS-BAR-25`, batch
  `B-2026-0001` / heat `HT-0001`)
- `SCR-2026-0001` (Scrap, 5 KG turning scrap recovered as
  `SCRAP-MS-TURNING`)
