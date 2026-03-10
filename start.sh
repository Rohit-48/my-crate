#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── Load .env ──────────────────────────────────────────────
if [ -f "$ROOT/.env" ]; then
  set -a; source "$ROOT/.env"; set +a
else
  echo "[warn] No .env found, using defaults"
fi

WEBHOOK_SECRET="${WEBHOOK_SECRET:-dev}"
API_PORT="${API_PORT:-3001}"
WEB_PORT="${WEB_PORT:-4321}"
WEBHOOK_PORT="${WEBHOOK_PORT:-3002}"

echo "Starting MY-CRATE (dev mode)..."

# ── Start services ─────────────────────────────────────────
(cd api && PORT=$API_PORT bun run index.ts) &
API_PID=$!

(cd web && PORT=$WEB_PORT npm run dev) &
WEB_PID=$!

(cd webhook && \
  WEBHOOK_SECRET=$WEBHOOK_SECRET \
  VAULT_PATH=./vault \
  DB_PATH=./data/notes.db \
  INDEXER_PATH=./indexer/target/debug/indexer \
  PORT=$WEBHOOK_PORT \
  cargo run) &
WEBHOOK_PID=$!

# ── Cleanup on exit ────────────────────────────────────────
cleanup() {
  echo "Shutting down..."
  kill $API_PID $WEB_PID $WEBHOOK_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "  API     → http://localhost:$API_PORT"
echo "  Web     → http://localhost:$WEB_PORT"
echo "  Webhook → http://localhost:$WEBHOOK_PORT"
echo "Press Ctrl+C to stop all"
wait
