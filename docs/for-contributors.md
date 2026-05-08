# For Contributors

Welcome to the Syncoboard project! This document is intended to help developers understand the architecture, directory structure, and development workflows to make contributing as smooth as possible.

## Directory Structure & Monorepo Architecture

Syncoboard is structured as a monorepo managed with [Bun](https://bun.sh/). The codebase is divided into **Apps**, **Packages**, and **Services**.

```text
syncoboard/
├── apps/               # End-user facing applications
│   ├── tui/            # The text-based terminal user interface (CLI app)
│   └── web/            # The main Next.js web application and REST API
├── packages/           # Shared libraries, utilities, and core logic
│   ├── api/            # Shared API client for network requests
│   ├── db/             # Database schemas, migrations, and Prisma client
│   ├── payment/        # Payment processing and subscription logic (PayPal, etc.)
│   ├── shared/         # Shared constants, enums, and cross-boundary logic
│   ├── types/          # Centralized TypeScript interfaces and type definitions
│   └── utils/          # Shared utility functions (e.g., entity cleanup, rate limiting)
├── services/           # Background processes and worker tasks
│   └── cron/           # Scheduled background jobs (e.g., cleanup scripts)
└── docs/               # Project documentation
```

### Apps

- **`apps/web`**: The core Next.js application. It serves dual purposes:
  - **Frontend:** Provides the dark-mode, terminal-inspired user dashboard and web UI.
  - **Backend (API):** Hosts the standard REST API routes (`/api/*`) used by the web app itself, the TUI, and other potential clients. It handles authentication (via NextAuth v5), database interactions, and business logic.
- **`apps/tui`**: A command-line interface built with the [Ink](https://github.com/vadimdemedes/ink) React framework. It consumes the API provided by `apps/web` using Personal Access Tokens (PATs) to allow users to manage their boards and tasks directly from their terminal.

### Packages

Packages encapsulate reusable code, enforcing modularity and clean architectural boundaries across the monorepo:

- **`@syncoboard/api`**: A universal API client used by `apps/tui` and potentially other services. It handles base URL resolution (supporting both client-side Next.js via `NEXT_PUBLIC_API_URL` and standard node environments) and standardized error handling.
- **`@syncoboard/db`**: The single source of truth for the database. Contains the `schema.prisma` file, migration history, and exports the generated Prisma Client. Used by `apps/web`, `services/cron`, and anywhere database access is required.
- **`@syncoboard/payment`**: Abstracts payment processing gateways. It defines interfaces for handling checkouts, subscriptions, and webhooks, allowing seamless integration with providers like PayPal. Used primarily by `apps/web`.
- **`@syncoboard/shared`**: Contains generic constants, validation regexes, and lightweight logic shared between the frontend, backend, and CLI.
- **`@syncoboard/types`**: Centralizes TypeScript type definitions to avoid duplication. It defines complex relational types (e.g., via `Prisma.GetPayload`) and domain-specific models. **Note:** This package is permitted to depend directly on `@syncoboard/db` to extract generated Prisma types.
- **`@syncoboard/utils`**: Contains cross-cutting business logic and utility functions. Examples include permanent deletion of soft-deleted entities (e.g., boards/workspaces marked deleted for over 3 months) and rate-limiting utilities. Used by background jobs and API routes.

### Services

- **`services/cron`**: Background worker processes that run scheduled tasks, such as purging old soft-deleted data or cleaning up rate-limit memory stores.

## Contributor Workflows and Conventions

To maintain a clean and performant codebase, please adhere to the following workflows and conventions.

### Local Setup & Running the Project

1. **Install Dependencies:** Run `bun install` at the root to install all workspace dependencies.
2. **Environment Variables:** Copy `.env.example` to `.env` and fill in the required values (Database URL, NextAuth secrets, etc.).
3. **Database:** Start the local PostgreSQL database using Docker:
   ```bash
   docker-compose up -d postgres
   ```
4. **Prisma Generation:** Generate the Prisma client locally. You must pass the database URL inline if it's not globally available:
   ```bash
   DATABASE_URL="postgresql://..." bun run --filter @syncoboard/db generate
   ```
5. **Start Applications:** The project uses PM2 to manage local dev processes. Start all applications and services simultaneously from the root:
   ```bash
   bun run start:pm2
   ```

### Testing

- We use **`bun test`** and the `bun:test` module as our primary test runner across all apps and packages.
- **Location:** Tests are typically located in a `__tests__` directory at the package or app root.
- **Mocking:** When mocking dependencies (especially `@syncoboard/db`), use `bun:test`'s `mock.module()`. Import the module-under-test dynamically inside your `beforeEach` or `it` block to ensure the mock is applied correctly before execution.
- **TypeScript `any`:** The codebase strictly forbids the use of the `any` type, even in test files. Use `unknown` and type assertions where necessary (e.g., `mock as unknown as AxiosInstance`).

### Code Formatting and Linting

- We use **Prettier** for formatting.
- Before committing, ensure your code passes the format check. The CI pipeline enforces this via the `bun check` script.
- To format your code automatically, run:
  ```bash
  bun x prettier --write .
  ```

### General Conventions

- **Database Queries:** Prefer database-level filtering (e.g., `prisma.findFirst`, `updateMany`) over fetching large datasets and filtering them in memory with JavaScript.
- **API Security:** API route handlers must include authorization checks directly within resource lookup queries (e.g., `where: { id: boardId, members: { some: { userId } } }`) to return generic "Not Found" errors instead of unauthorized errors, preventing resource enumeration.
- **Dependencies:** If you are building packages via `tsc`, ensure upstream dependencies are built first (`bun run build` in the respective packages) and the Prisma client is generated to prevent type declaration errors.

Thank you for your interest in contributing to Syncoboard!
