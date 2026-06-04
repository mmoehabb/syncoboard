# deployer

A HTTP-based deployment service (bash + socat) that listens for authenticated
webhooks, pulls the latest code, builds, and restarts PM2 applications.

## Requirements

- `socat` — install with your package manager (`apt install socat`, `brew install socat`)
- `bun` — project runtime
- `pm2` — process manager (installed globally or via bunx)

## Configuration

```bash
cp .env.example .env
```

### Environment Variables

- `PORT` (optional): HTTP listen port. Defaults to `4001`.
- `DEPLOYER_SECRET` (required): Bearer token for authenticating deploy requests.

## Running

Via PM2 (production):

```bash
bun run deployer start
```

Directly:

```bash
PORT=4001 DEPLOYER_SECRET=mysecret bash services/deployer/deploy.sh server
```

Manual deploy (without HTTP server):

```bash
bash services/deployer/deploy.sh deploy
```

## API

```
POST /deploy
Authorization: Bearer <DEPLOYER_SECRET>
```

Returns `202 Accepted` and runs deployment asynchronously.
