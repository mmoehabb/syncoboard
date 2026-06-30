# Agents Documentation Index

Welcome to the Syncoboard `.agents` documentation directory. Syncoboard is a powerful, unified productivity application and toolset built for developers, providing a terminal-inspired workflow, lightning-fast web interface, and standard REST API backend.

This directory contains vital context and instructions that will guide subsequent agents and developers in understanding, navigating, and safely modifying the codebase.

## Directory Structure

```
.agents/
├── index.md         # This entry point
├── memory.md        # Categorized rules, memory points, and learned project context
├── architecture.md  # System architecture and domain boundaries
├── apps.md          # Details on end-user facing applications (apps/)
├── packages.md      # Details on shared libraries and utilities (packages/)
└── services.md      # Details on background workers and standalone services (services/)
```

## Available Documentation

- **[Memory](./memory.md):** The most critical file. Contains categorized historical context, testing strategies, execution rules, coding conventions, and architectural nuances. You MUST review this to avoid past mistakes.
- **[Architecture](./architecture.md):** An overview of the monorepo architecture, data flow, and interactions between different components.
- **[Apps](./apps.md):** Documentation for the applications in the `apps/` directory (`dashboard`, `maintenance`, `tui`, `web`).
- **[Packages](./packages.md):** Documentation for the shared packages in the `packages/` directory (`api`, `db`, `payment`, `shared`, `types`, `utils`).
- **[Services](./services.md):** Documentation for the background processes and workers in the `services/` directory (`cron`, `deployer`, `webhook`, `websocket`).
