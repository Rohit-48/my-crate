#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Starting Obsidian Publish stack..."

# Start Hono API
(cd api && bun run index.ts) &
API_PID=$!

# Start Astro frontend
(cd web && npm run dev) &
WEB_PID=$!

# Start Webhook
(cd webhook && WEBHOOK_SECRET=dev VAULT_PATH=./vault DB_PATH=./data/notes.db INDEXER_PATH=./indexer/target/debug/indexer cargo run) &
WEBHOOK_PID=$!

cleanup() {
  echo "Shutting down..."
  kill $API_PID $WEB_PID $WEBHOOK_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "API (3001): PID $API_PID"
echo "Web (4321): PID $WEB_PID"
echo "Webhook: PID $WEBHOOK_PID"
echo "Press Ctrl+C to stop all"
wait
