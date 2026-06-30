# Services (`services/`)

The `services/` directory contains standalone, background, and worker applications that operate independently of the primary web application. They handle scheduled tasks, asynchronous processing, and specialized networking protocols.

## Available Services

### `services/cron`

**Purpose:** Handles scheduled background jobs.

- Executes maintenance tasks that need to run at specific intervals.
- Examples include purging old soft-deleted data (e.g., workspaces marked for deletion over 3 months ago) and cleaning up expired rate-limit data from memory/database stores.

### `services/deployer` (`@syncoboard/deployer`)

**Purpose:** The deployment orchestration service.

- Manages the automated deployment pipelines and rollouts for Syncoboard instances or specific integrated components.

### `services/webhook` (`@syncoboard/webhook`)

**Purpose:** Dedicated webhook listener and processor.

- Primarily responsible for receiving, validating, and processing incoming webhook events from external platforms (e.g., GitHub, PayPal).
- For example, it processes GitHub repository events and maps them to board actions, ignoring events for inactive boards.

### `services/websocket`

**Purpose:** The real-time messaging and signaling server.

- Handles real-time, low-latency communication via WebSockets (Socket.io).
- Crucially, this service handles the signaling mechanism (join, leave, signal exchange) required for WebRTC voice calls, bypassing the need for heavy database persistence for transient connection states.
