# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

No test framework is configured.

## Architecture

Next.js 16 App Router project implementing a **Service-Oriented Architecture (SOA)** for an automotive company. All data is **in-memory** (static arrays with seed data, no database).

### Service Classification

- **Entity Services** (CRUD): cliente, vehiculo, inspeccion, subasta, venta
- **Task Services** (business logic): precio (price calculation), procesar-venta (sale orchestrator)
- **Utility Services** (cross-cutting): autenticacion (token auth), notificacion (simulated), integracion-crm (simulated)

### Module Structure

Each module under `modules/` follows: `controllers/ → services/ → repositories/ → models/` with `dtos/` for API contracts. Entity services have all five layers; utility/task services skip repositories and models.

### Orchestrator: Procesar Venta

`modules/venta/services/procesar-venta.service.ts` implements a **Saga pattern with compensatory transactions**:

1. **Phase 1** (read-only, no compensation): validate token → fetch client → fetch vehicle → verify inspection → verify no active auction
2. **Phase 2** (mutations with rollback): register sale → update vehicle status → send notification → sync CRM

If any Phase 2 step fails, compensations execute in reverse order.

### API Endpoints

All routes live under `app/api/v1/`. Each `route.ts` instantiates a controller and delegates.

- `POST /autenticar` — returns a Bearer token (users: admin/admin123, vendedor/vend123, inspector/insp123)
- `GET|POST /clientes`, `GET|PUT|DELETE /clientes/[id]`
- `GET|POST /vehiculos`, `GET|PUT|DELETE /vehiculos/[id]`
- `GET|POST /inspecciones`, `GET|PUT|DELETE /inspecciones/[id]`
- `GET|POST /subastas`, `GET|PUT|DELETE /subastas/[id]`
- `GET|POST /ventas`, `GET|PUT|DELETE /ventas/[id]`
- `POST /calcular-precio` — price calculation with depreciation
- `POST /procesar-venta` — **orchestrator** (requires `Authorization: Bearer <token>`)
- `POST /enviar-notificacion` — simulated notification
- `POST /sincronizar-crm` — simulated CRM sync

### Shared Conventions

- Path alias: `@/*` maps to project root (e.g., `@/modules/shared/helpers`)
- All responses use `ApiSuccessResponse<T>` or `ApiErrorResponse` from `modules/shared/types.ts`
- Helper functions in `modules/shared/helpers.ts`: `successResponse()`, `errorResponse()`, `jsonResponse()`, `parseBody()`
- IDs use prefixed format: `CL-001`, `VH-001`, `IN-001`, `SB-001`, `VT-001`, `NT-001`
