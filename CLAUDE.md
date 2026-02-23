# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Three independent apps under `apps/`:

- **`apps/api`** — Cloudflare Workers GraphQL API (TypeScript)
- **`apps/web`** — React SPA frontend (TypeScript)
- **`apps/ortools`** — OR-Tools VRP solver serverless service (Python, Modal)

Package manager: **pnpm** (monorepo root has no shared dependencies — each app manages its own `pnpm install`).

---

## apps/api — Cloudflare Workers + GraphQL

**Stack:** Hono · GraphQL Yoga · Drizzle ORM · Neon (serverless PostgreSQL) · JWT (hono/jwt) · bcryptjs

### Commands (run from `apps/api/`)
```bash
pnpm dev          # Wrangler local dev server
pnpm deploy       # Deploy to Cloudflare Workers
pnpm generate     # Generate Drizzle migrations from schema
pnpm migrate      # Apply migrations to Neon DB
pnpm cf-typegen   # Regenerate CloudflareBindings types
```

> For `pnpm generate` and `pnpm migrate`, the comment in `drizzle.config.ts` notes that in a monorepo the commands must be run from within the `apps/api/` directory.

### Local environment
Copy `.env` and set `DATABASE_URL` (Neon connection string) and `JWT_SECRET`. Wrangler reads `.dev.vars` (not `.env`) for secrets locally.

### Architecture
- `src/index.ts` — Hono entry point; mounts GraphQL Yoga at `/graphql`, performs startup env-var checks.
- `src/graphql/schema.ts` — Merges all `typeDefs` and `resolvers`; defines `JSON` scalar.
- `src/graphql/context.ts` — `Context` type (`db`, `user`, `env`); `requireAuth(user, minRole)` helper (role order: `just_view < guest < normal < manager < admin`).
- `src/graphql/resolvers/` — One file per domain: `account`, `destination`, `vehicle`, `order`, `compute`.
- `src/db/schema.ts` — Single source of truth for all tables (Drizzle). Key entities: `account`, `destination`, `custom_vehicle_type`, `vehicle`, `order`, `compute`, `route`, `route_stop`, `point_log`, `info_between_two_point`.
- `src/db/connect.ts` — Creates Drizzle instance with Neon HTTP client.

### Adding a new GraphQL domain
1. Create `src/graphql/resolvers/<name>.ts` exporting `<name>TypeDefs` and `<name>Resolvers`.
2. Import and register both in `src/graphql/schema.ts` (add to `typeDefs` array and `mergeResolvers` call).

### Optimization flow
1. User creates `destination` and `vehicle` records.
2. User creates an `order` (stores snapshots of destinations/vehicles).
3. `createCompute` mutation creates a `compute` record and triggers the OR-Tools service.
4. Results are written back to `route` and `route_stop` tables.

---

## apps/web — React SPA

**Stack:** React 19 · TanStack Router (file-based) · TanStack Query · Zustand · Tailwind CSS v4 · DaisyUI · Vite

### Commands (run from `apps/web/`)
```bash
pnpm dev      # Vite dev server
pnpm build    # Type-check + Vite production build
pnpm preview  # Preview production build
```

### Environment
`VITE_API_BASE_URL` in `.env` — base URL for the GraphQL API (defaults to same-origin).

### Architecture
- `src/main.tsx` — Root; wraps with `QueryClientProvider` and `RouterProvider`.
- `src/routes/` — File-based routing (TanStack Router). `_auth.tsx` is the authenticated layout wrapper; all `_auth.*` routes require login. `__root.tsx` is the root layout.
- `src/routeTree.gen.ts` — **Auto-generated** by the Vite plugin; never edit manually.
- `src/services/api.ts` — Core `gql<T>(query, variables)` fetch helper; handles `Authorization: Bearer` header from `localStorage`, redirects to `/login` on 401/Unauthorized.
- `src/stores/auth.ts` — Zustand store; persists JWT token in `localStorage`.
- `src/hooks/` — TanStack Query hooks per domain (`useLocations`, `useVehicles`, `useVehicleTypes`).
- `src/services/` — GraphQL query/mutation definitions per domain.
- `src/components/` — UI components organized by domain and layout.
- `src/views/` — Page-level components rendered by routes.
- Path alias `@/` maps to `src/`.

### Adding a new route
Create a file in `src/routes/` (e.g., `_auth.orders.tsx`) — the router plugin auto-generates the route tree on next `pnpm dev` or `pnpm build`.

---

## apps/ortools — VRP Solver (Python + Modal)

**Stack:** Python 3.14 · FastAPI · Google OR-Tools · Modal · Pydantic · httpx

### Commands (run from `apps/ortools/`)
```bash
modal serve src/main.py    # Hot-reload dev on Modal infrastructure
modal deploy src/main.py   # Deploy to Modal
python src/local_dev.py    # Pure local dev (no Modal, uses uvicorn on :8000)
```

Dependencies are declared inside `src/main.py` via `modal.Image` (no `requirements.txt`).

### Architecture
- `src/main.py` — Defines Modal `App`, image, and exposes two components: `solve_vrp` (compute function, 1 CPU / 2 GB RAM) and `api` (ASGI FastAPI app).
- `src/vrp/router.py` — FastAPI router; `POST /vrp/solve` spawns `solve_vrp` as a background task, returns `202 + job_id`.
- `src/vrp/schema.py` — Pydantic models for `VRPRequest`, locations, vehicles, matrices.
- `src/vrp/solver.py` — OR-Tools routing model: distance cost, capacity dimension (pickup/delivery), time window dimension, GLS metaheuristic. Posts result JSON to `webhook_url` when done.
- `src/local_dev.py` — Local shim that replaces Modal's `.spawn.aio()` with `asyncio.create_task`.

### Async workflow
The solver is fire-and-forget. Callers must supply a `webhook_url`; the solved route result (or error) is POSTed there when computation finishes.
