# Packages (`packages/`)

The `packages/` directory contains modular, shared libraries that enforce clean architectural boundaries across the monorepo. Code in these packages must not import anything from the `apps/` or `services/` directories.

## Available Packages

### `@syncoboard/api`

**Purpose:** The universal standard API client.

- An Axios-based client providing typed methods for interacting with the core Syncoboard REST API (hosted in `apps/web`).
- Used by the frontend dashboard, the CLI application (`apps/tui`), and potentially other internal services.
- Handles URL resolution automatically based on the execution environment.

### `@syncoboard/db`

**Purpose:** The single source of truth for database interactions.

- Contains the `schema.prisma` file, migration history, and exports the generated Prisma Client.
- Any app or service needing database access imports the Prisma client from this package.

### `@syncoboard/payment`

**Purpose:** Abstraction layer for payment and subscription processing.

- Integrates with providers like PayPal to handle checkouts, subscription validations, and pricing interval logic.
- Centralizes the business rules regarding subscription lengths (e.g., mapping 'LIFETIME' intervals to provider-specific constraints).

### `@syncoboard/shared`

**Purpose:** Shared constants, configurations, and core application utilities.

- Contains the configured Pino `logger` instance.
- Houses data serialization utilities (e.g., `serializeBigInt` for API routes).
- Stores common regexes, enumerations, and UI/backend shared constants.

### `@syncoboard/types`

**Purpose:** Centralized TypeScript definitions.

- Extracts complex relational types from Prisma using `Prisma.GetPayload` and provides domain-specific interfaces used across multiple packages and apps.
- This package is permitted to depend directly on `@syncoboard/db` to acquire generated types.

### `@syncoboard/utils`

**Purpose:** Cross-cutting business logic and pure utility functions.

- Functions used by various parts of the app, such as rate limiting, entity cleanup logic, and generalized validation helpers.
