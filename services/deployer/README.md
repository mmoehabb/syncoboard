# deployer

A simple deployment service that listens for authorized webhooks, pulls the latest code, builds, and restarts the PM2 applications.

## Configuration

Before running the service, you need to configure the required environment variables. Copy the example file and update it with your actual settings:

```bash
cp .env.example .env
```

### Environment Variables

- `PORT` (optional): The port the deployment server will listen on. Defaults to `4001`.
- `DEPLOYER_SECRET` (required): A secure secret used to authenticate incoming webhook requests. The service expects this to be passed as a Bearer token in the `Authorization` header (`Authorization: Bearer <your_secret>`).

## Installation

To install dependencies:

```bash
bun install
```

## Running the Service

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.14. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
