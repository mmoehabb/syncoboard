# Monorepo Architecture

Syncoboard is architected as a modern, strict monorepo leveraging Bun as the primary runtime and package manager. The monorepo splits concerns into three distinct primary domains:

## 1. Top-Level Organization

- **`apps/`**: Contains the end-user facing applications (Next.js, TUI, etc.). These applications are the consumers of packages and rely on external services.
- **`packages/`**: Contains shared libraries, the database ORM, universal types, and core business/utility logic. These packages do NOT depend on `apps/` or `services/`.
- **`services/`**: Contains independent, long-running backend processes (webhooks, websocket servers, cron jobs, deployment orchestration). These services depend on `packages/` but not on `apps/`.
- **`sdks/`**: Contains software development kits for external integrations (e.g., Go SDK).

## 2. Core Data Flow & Database

The absolute source of truth for data is the PostgreSQL database, managed entirely via Prisma within the `@syncoboard/db` package (`packages/db`).

- **No direct DB connections in apps (mostly):** While `apps/web` can connect directly to the database to serve its internal REST API, other apps (like `apps/tui`) and external clients MUST go through the REST API exposed by `apps/web`.
- **Services interact with DB:** Standalone services (like `services/webhook` and `services/cron`) use the Prisma client from `@syncoboard/db` directly to execute their specialized tasks.

## 3. The Central API (`apps/web` and `@syncoboard/api`)

- `apps/web` is not just a frontend. It hosts the definitive, standard REST API (`/api/*`) for the entire Syncoboard ecosystem.
- To ensure consistent consumption of this API, the `@syncoboard/api` package acts as the universal Axios-based API client.
- The TUI (`apps/tui`) uses this API client, authenticating via Personal Access Tokens (PATs).
- The Next.js frontend (`apps/web`) also uses this client for client-side fetching.

## 4. Subscriptions and Payments

- Subscription tiers and payments are abstracted via `@syncoboard/payment`.
- This package provides the provider interfaces (e.g., PayPal integration).
- `apps/web` exposes API routes that trigger checkouts using this package, and frontend code redirects users based on the generated approval URLs.

## 5. Security Model

- **Authentication:** Admin and standard user sessions are handled securely via HttpOnly cookies and NextAuth v5 in `apps/web`.
- **Authorization:** The system employs a strict Role-based Access Control (RBAC) mechanism (ADMIN, MODERATOR, MEMBER) governing workspace and board modifications. These checks are typically enforced deep at the database query level to prevent resource enumeration.
