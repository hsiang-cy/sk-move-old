# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands (run from `apps/ortools/`)

```bash
uv sync                         # Install / sync deps from pyproject.toml into .venv
uv run python src/local_dev.py  # Pure local dev — no Modal, uvicorn on :8000
uv run modal serve src/main.py  # Hot-reload dev on Modal infrastructure
uv run modal deploy src/main.py # Deploy to Modal
```

`modal` is a dev-only dep (`[dependency-groups].dev`); runtime deps are in `[project].dependencies`.

## Architecture

Fire-and-forget async solver. The caller POSTs to `/vrp/solve`, gets a `202` immediately, and receives the result later via `webhook_url`.

**Request path:**
```
POST /vrp/solve
  → router.py validates matrix dimensions
  → solve_vrp.spawn.aio(compute_id, request)   ← spawns Modal background task
  → returns 202 immediately

Modal container:
  solve_vrp() → solver.py:solve_vrp_logic()
  → builds OR-Tools RoutingModel
  → POSTs JSON result to webhook_url
```

**Key files:**
- `src/main.py` — Modal `App` definition; sets `cpu=1.0, memory=2048` for the solver function; the `api` function wraps FastAPI as an ASGI app and injects `solve_vrp` into `app.state`.
- `src/vrp/router.py` — Single route `POST /vrp/solve`; validates that matrix dimensions match `len(locations)` then calls `req.app.state.solve_vrp.spawn.aio()`.
- `src/vrp/schema.py` — `VRPRequest` Pydantic model. `distance_matrix` in metres, `time_matrix` in minutes, `time_window_*` in minutes (default end: 1440).
- `src/vrp/solver.py` — Implements 4 constraints: arc cost (total distance), capacity (pickup − delivery net load), time windows (with service time), fixed vehicle cost. Uses `PATH_CHEAPEST_ARC` as first solution + `GUIDED_LOCAL_SEARCH` metaheuristic. Posts `{status, total_distance, routes}` or `{status: "error", message}` to `webhook_url`.
- `src/local_dev.py` — Replaces Modal's `spawn.aio()` with `asyncio.create_task` + `run_in_executor` for pure local testing.

## Solver constraints

OR-Tools `RoutingModel` is single-threaded — increasing CPU beyond 1–2 cores does not speed up a single solve. Scale **memory** for large inputs (distance/time matrices are N²). Parallelism is achieved at the task level: Modal spawns one container per request.

Current constraints in `solver.py`:
- Capacity: per-vehicle limit; net demand = `pickup - delivery` at each node
- Time window: hard constraint (no `AddDisjunction`); infeasible → raises `ValueError`
- Fixed cost: activated when `vehicle.fixed_cost > 0`, discourages unnecessary vehicle use
- All vehicles share the same depot (`depot_index`, default 0)

## Webhook payload

Success:
```json
{ "compute_id": 1, "status": "success", "total_distance": 4000, "routes": [...] }
```
Error:
```json
{ "compute_id": 1, "status": "error", "message": "..." }
```

Each route stop includes: `location_id`, `name`, `arrival_time`, `pickup`, `delivery`.
