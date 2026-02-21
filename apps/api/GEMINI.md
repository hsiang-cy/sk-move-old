# Gemini CLI - Instructions for API Project

『回答時盡量使用繁體中文。』
『回答時盡量使用繁體中文。』
『回答時盡量使用繁體中文。』

This project is a Cloudflare Workers-based API, providing a GraphQL interface for routing and logistics optimization. It uses Hono as the web framework, GraphQL Yoga for the API layer, and Drizzle ORM for database management with a Neon serverless PostgreSQL backend.

## Project Overview

- **Framework:** [Hono](https://hono.dev/) (Running on Cloudflare Workers)
- **API Layer:** [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** [Neon](https://neon.tech/) (Serverless PostgreSQL)
- **Authentication:** JWT-based (using `hono/jwt`) and `bcryptjs` for password hashing.
- **Language:** TypeScript

### Core Architecture

- `src/index.ts`: The main entry point, sets up the Hono app, middleware (JWT verification), and mounts the GraphQL Yoga handler.
- `src/graphql/schema.ts`: Defines the GraphQL type definitions and resolvers. It uses a context-driven approach to inject the database instance and current user.
- `src/db/schema.ts`: Single source of truth for the database schema using Drizzle ORM. Includes tables for `user`, `destination`, `vehicle`, `route`, and `compute` (optimization tasks).
- `src/db/connect.ts`: Utility for initializing the Drizzle instance with the Neon HTTP client.
- `wrangler.jsonc`: Cloudflare Workers configuration file.

## Building and Running

Ensure you have `pnpm` installed for dependency management.

### Installation

```bash
pnpm install
```

### Local Development

Start the Wrangler development server:

```bash
pnpm dev
```

### Database Management

The project uses Drizzle Kit for migrations.

- **Generate migrations:**
  ```bash
  pnpm generate
  ```
- **Apply migrations:**
  ```bash
  pnpm migrate
  ```
- **Type Generation (Cloudflare Bindings):**
  ```bash
  pnpm cf-typegen
  ```

### Deployment

Deploy to Cloudflare Workers:

```bash
pnpm deploy
```

## Development Conventions

### Coding Standards

- **TypeScript:** Strict typing is preferred. Use `CloudflareBindings` for environment variable types.
- **Drizzle ORM:** Always update `src/db/schema.ts` when changing the database structure and run `pnpm generate`.
- **GraphQL:** Keep resolvers lean by delegating complex logic to services or utility functions if needed. Use the `Context` type defined in `src/graphql/schema.ts`.

### Security

- **Environment Variables:** Critical variables like `DATABASE_URL` and `JWT_SECRET` must be set in the Cloudflare dashboard or via `.dev.vars` for local development.
- **Password Hashing:** Always use `bcryptjs` for storing passwords.
- **Authorization:** Check `context.user` in GraphQL resolvers to enforce access control. The `user_role` field in the `user` table defines permissions (admin, manager, user, guest, just_view).

### Optimization Flow

The database schema suggests an optimization workflow:
1. Users define `destinations` and `vehicles`.
2. An `order` is created (taking snapshots of destinations and vehicles).
3. A `compute` task is triggered to calculate the best `routes`.
4. The result is stored in `route` and `route_stop` tables.
