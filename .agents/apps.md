# Apps (`apps/`)

The `apps/` directory contains the end-user facing applications and interfaces for the Syncoboard ecosystem.

## Available Applications

### `apps/web`

**Purpose:** The core Next.js application (Frontend + Backend API).

- **Frontend:** Provides the terminal-inspired, dark-mode web dashboard for users. It utilizes libraries like `recharts` for data visualization and `@hello-pangea/dnd` for drag-and-drop mechanics.
- **Backend:** Hosts the primary REST API (`/api/*`) used by the entire ecosystem. It manages authentication (via NextAuth), interacts with the database (`@syncoboard/db`), and processes subscription checkouts.

### `apps/dashboard`

**Purpose:** An alternative or specialized dashboard application (Next.js).

- Similar to `web`, it requires specific environment variables (`NEXT_PUBLIC_API_URL`, etc.) to build and run. It likely serves as a dedicated portal for specific administrative or specialized user views distinct from the main web application.

### `apps/tui`

**Purpose:** The Text-based Terminal User Interface.

- A command-line application built with the Ink React framework.
- It allows developers and power users to interact with Syncoboard directly from their terminal, managing boards and tasks.
- It consumes data by communicating with the `apps/web` REST API using Personal Access Tokens (PATs) and the `@syncoboard/api` client.

### `apps/maintenance`

**Purpose:** Maintenance application or landing page.

- Used to serve maintenance pages, status updates, or specific fallback UIs when the primary applications are undergoing updates or experiencing downtime.
