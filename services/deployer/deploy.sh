#!/usr/bin/env bash
set -uo pipefail

SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"

CONFIG_DIR="${XDG_RUNTIME_DIR:-/tmp}/syncoboard-deployer"
LOCK_FILE="$CONFIG_DIR/deploy.lock"
PENDING_FILE="$CONFIG_DIR/deploy.pending"
LASTTIME_FILE="$CONFIG_DIR/deploy.lasttime"
RATE_LIMIT_MS=60000

mkdir -p "$CONFIG_DIR"

PORT="${PORT:-4001}"
DEPLOYER_SECRET="${DEPLOYER_SECRET:-}"

get_root_dir() {
  cd "$(dirname "$SCRIPT_PATH")/../.." && pwd
}

get_apps_to_manage() {
  local root
  root=$(get_root_dir)
  bun -e "
    const c = require('$root/ecosystem.config.js');
    console.log(c.apps.map(a=>a.name).filter(n=>!['deployer','maintenance','webhook'].includes(n)).join(' '));
  "
}

deploy() {
  local root commit apps
  root=$(get_root_dir)
  commit=$(git -C "$root" rev-parse HEAD)
  apps=$(get_apps_to_manage)

  echo "[Deployer] Deploying at commit $commit"

  echo "[Deployer] Stopping: $apps"
  bunx pm2 stop $apps 2>&1 || true

  echo "[Deployer] Starting maintenance app"
  bunx pm2 start "$root/ecosystem.config.js" --only maintenance 2>&1 || true

  (
    set -e
    echo "[Deployer] Pulling latest code from origin/main..."
    git -C "$root" pull origin main

    echo "[Deployer] Installing dependencies..."
    bun install --cwd "$root"

    echo "[Deployer] Running clean..."
    bun --cwd "$root" run clean

    echo "[Deployer] Running DB migrations..."
    bun --cwd "$root" run db migrate:deploy

    echo "[Deployer] Building..."
    bun --cwd "$root" run build:low-spec
  ) 2>&1
  build_exit=$?
  if [[ $build_exit -ne 0 ]]; then
    echo "[Deployer] Build failed! Rolling back to $commit..."

    git -C "$root" reset --hard "$commit"
    bun install --cwd "$root"
    bun --cwd "$root" run clean
    bun --cwd "$root" run db migrate:deploy
    bun --cwd "$root" run build:low-spec || true

    echo "[Deployer] Rollback build completed."
  fi

  echo "[Deployer] Stopping maintenance app"
  bunx pm2 stop maintenance 2>&1 || true

  echo "[Deployer] Restarting: $apps"
  bunx pm2 restart $apps 2>&1 || {
    echo "[Deployer] pm2 restart failed, trying pm2 start..."
    bunx pm2 start "$root/ecosystem.config.js" --only "${apps// /,}" 2>&1 || true
  }

  echo "[Deployer] Deployment process completed successfully!"
}

handle() {
  local method path auth_token line

  read -r method path _ <&0
  if [[ -z "$method" || -z "$path" ]]; then
    echo -e "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{\"error\":\"Bad request\"}"
    return
  fi

  while IFS= read -r line; do
    line=${line%%$'\r'}
    [[ -z "$line" ]] && break
    case "$line" in
      "Authorization: Bearer "*) auth_token="${line#Authorization: Bearer }" ;;
    esac
  done

  if [[ "$method" != "POST" || "$path" != "/deploy" ]]; then
    echo -e "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"error\":\"Not found\"}"
    return
  fi

  if [[ -z "$DEPLOYER_SECRET" || "$auth_token" != "$DEPLOYER_SECRET" ]]; then
    echo -e "HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\n\r\n{\"error\":\"Unauthorized\"}"
    return
  fi

  local now
  now=$(date +%s%3N)
  if [[ -f "$LASTTIME_FILE" ]]; then
    local last_time
    last_time=$(<"$LASTTIME_FILE")
    if (( now - last_time < RATE_LIMIT_MS )); then
      echo -e "HTTP/1.1 429 Too Many Requests\r\nContent-Type: application/json\r\n\r\n{\"error\":\"Rate limit exceeded. Please wait 1 minute between requests.\"}"
      return
    fi
  fi

  if [[ -f "$LOCK_FILE" ]]; then
    if [[ -f "$PENDING_FILE" ]]; then
      echo -e "HTTP/1.1 202 Accepted\r\nContent-Type: application/json\r\n\r\n{\"message\":\"A deployment is already running and one is queued. Request ignored.\"}"
      return
    fi
    echo "$now" > "$LASTTIME_FILE"
    touch "$PENDING_FILE"
    echo -e "HTTP/1.1 202 Accepted\r\nContent-Type: application/json\r\n\r\n{\"message\":\"A deployment is currently running. Your deployment has been queued.\"}"
    return
  fi

  echo "$now" > "$LASTTIME_FILE"
  touch "$LOCK_FILE"

  (
    while true; do
      rm -f "$PENDING_FILE"
      "$SCRIPT_PATH" deploy 1>&2
      if [[ ! -f "$PENDING_FILE" ]]; then
        break
      fi
    done
    rm -f "$LOCK_FILE"
  ) </dev/null >/dev/null &

  echo -e "HTTP/1.1 202 Accepted\r\nContent-Type: application/json\r\n\r\n{\"message\":\"Deployment accepted and started.\"}"
}

server() {
  if ! command -v socat &>/dev/null; then
    echo "[Deployer] Error: socat is not installed. Install it with: apt install socat" >&2
    exit 1
  fi

  if [[ -z "$DEPLOYER_SECRET" ]]; then
    echo "[Deployer] WARNING: DEPLOYER_SECRET is not set. Service will reject all requests." >&2
  fi

  echo "[Deployer] Service listening on port $PORT"
  socat TCP-LISTEN:"$PORT",reuseaddr,fork EXEC:"$SCRIPT_PATH handle"
}

case "${1:-server}" in
  server)
    trap 'rm -f "$LOCK_FILE" "$PENDING_FILE"' EXIT
    server
    ;;
  handle) handle ;;
  deploy) deploy ;;
  *)
    echo "Usage: $0 {server|deploy}" >&2
    exit 1
    ;;
esac
