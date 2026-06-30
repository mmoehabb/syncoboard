# For Contributors

Welcome to the Syncoboard project! This document is intended to help developers understand the architecture, directory structure, and development workflows to make contributing as smooth as possible.

## 🤖 Agents & LLM Assistants

If you are an AI, Agent, or LLM Assistant working on this codebase, you **MUST** read the documentation located in the root `AGENTS.md` and the `.agents/` directory before proceeding with any modifications. The `.agents/memory.md` file contains critical learned context that will prevent you from making historical mistakes.

For human developers, the `.agents/` directory is also highly recommended reading as it contains the most up-to-date architectural boundaries and coding conventions.

## Directory Structure & Monorepo Architecture

Syncoboard is structured as a modern monorepo managed with [Bun](https://bun.sh/). The codebase is strictly divided into distinct domains:

```text
syncoboard/
├── .agents/            # Agent guidelines, memory, and architecture rules
├── apps/               # End-user facing applications
│   ├── dashboard/      # Secondary dashboard interface
│   ├── maintenance/    # Maintenance mode application
│   ├── tui/            # Text-based terminal user interface (CLI app)
│   └── web/            # Main Next.js web application and central REST API
├── packages/           # Shared libraries, utilities, and core logic
│   ├── api/            # Universal API client
│   ├── db/             # Database schemas, migrations, and Prisma client
│   ├── payment/        # Payment processing and subscription logic
│   ├── shared/         # Shared constants, loggers, and types
│   ├── types/          # Centralized TypeScript definitions
│   └── utils/          # Cross-cutting business logic
├── services/           # Background processes and worker tasks
│   ├── cron/           # Scheduled background jobs
│   ├── deployer/       # Deployment orchestration
│   ├── webhook/        # Webhook listener and processor
│   └── websocket/      # Real-time signaling and WebRTC
├── sdks/               # Software Development Kits for external integration
│   └── go/             # Go SDK
└── docs/               # General project documentation
```

### Architectural Boundaries

- **Apps** consume packages and services but do not depend on each other. `apps/web` acts as the central source of truth for the REST API.
- **Packages** encapsulate reusable code (`api`, `db`, `payment`, etc.) and enforce strict boundaries. They never import from `apps/` or `services/`.
- **Services** are independent, long-running processes that utilize `packages/` to perform their duties (e.g., cron jobs, websocket connections).

For a deep dive into each component, refer to:

- [Monorepo Architecture](../.agents/architecture.md)
- [Apps Documentation](../.agents/apps.md)
- [Packages Documentation](../.agents/packages.md)
- [Services Documentation](../.agents/services.md)

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
- Tests should be run scoped to specific packages (e.g., `bun test packages/api/`) to avoid Bun segmentation faults at the root level.
- When mocking Prisma in `bun:test`, use `mock.module("@syncoboard/db", ...)` globally.
- The codebase strictly forbids the use of the `any` type, even in test files. Use `unknown` and type assertions where necessary.

### Code Formatting and Linting

- We use **Prettier** for formatting.
- Before committing, ensure your code passes the format check.
- To format your code automatically, run:
  ```bash
  bun x prettier --write .
  ```
- Formatting the Prisma schema must be done explicitly via `bun x prisma format`.

Thank you for your interest in contributing to Syncoboard!
