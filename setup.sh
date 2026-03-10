#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── Colors ─────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[my-crate]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
die()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── Load .env ──────────────────────────────────────────────
if [ ! -f "$ROOT/.env" ]; then
  die ".env not found. Run: cp .env.example .env and fill in your values."
fi
set -a; source "$ROOT/.env"; set +a

: "${WEBHOOK_SECRET:?WEBHOOK_SECRET is not set in .env}"
: "${SERVICE_USER:?SERVICE_USER is not set in .env}"
API_PORT="${API_PORT:-3001}"
WEB_PORT="${WEB_PORT:-4321}"
WEBHOOK_PORT="${WEBHOOK_PORT:-3002}"

HOME_DIR=$(eval echo "~$SERVICE_USER")
ROOT_DIR="$HOME_DIR/$(basename "$ROOT")"

# ── Dependency checks ──────────────────────────────────────
log "Checking dependencies..."
command -v git    >/dev/null || die "git not found"
command -v cargo  >/dev/null || die "cargo not found — install Rust: https://rustup.rs"
command -v bun    >/dev/null || die "bun not found — install: https://bun.sh"
command -v node   >/dev/null || die "node not found"
command -v nginx  >/dev/null || die "nginx not found — run: sudo apt install nginx"

# ── Build ──────────────────────────────────────────────────
log "Building Rust indexer (release)..."
cd "$ROOT/indexer" && cargo build --release
log "Building Rust webhook (release)..."
cd "$ROOT/webhook" && cargo build --release
log "Installing API dependencies..."
cd "$ROOT/api" && bun install
log "Building Astro frontend..."
cd "$ROOT/api" && bun run index.ts &
API_PID=$!
sleep 2
cd "$ROOT/web" && npm install && npm run build
kill $API_PID 2>/dev/null || true
cd "$ROOT"

# ── Init DB ────────────────────────────────────────────────
mkdir -p "$ROOT/data"
log "Running indexer to populate database..."
"$ROOT/indexer/target/release/indexer" \
  --vault "$ROOT/vault" \
  --db "$ROOT/data/notes.db"

# ── Systemd services ───────────────────────────────────────
log "Installing systemd services..."

sudo tee /etc/systemd/system/my-crate-api.service > /dev/null << EOF
[Unit]
Description=MY-CRATE Hono API
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$ROOT_DIR/api
ExecStart=$HOME_DIR/.bun/bin/bun run index.ts
Restart=always
RestartSec=5
Environment=PORT=$API_PORT
Environment=DB_PATH=$ROOT_DIR/data/notes.db

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/my-crate-webhook.service > /dev/null << EOF
[Unit]
Description=MY-CRATE Webhook
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$ROOT_DIR
ExecStart=$ROOT_DIR/webhook/target/release/webhook
Restart=always
RestartSec=5
Environment=WEBHOOK_SECRET=$WEBHOOK_SECRET
Environment=VAULT_PATH=$ROOT_DIR/vault
Environment=DB_PATH=$ROOT_DIR/data/notes.db
Environment=INDEXER_PATH=$ROOT_DIR/indexer/target/release/indexer
Environment=PORT=$WEBHOOK_PORT

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/my-crate-web.service > /dev/null << EOF
[Unit]
Description=MY-CRATE Astro Frontend
After=network.target my-crate-api.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$ROOT_DIR/web
ExecStart=/usr/bin/node ./dist/server/entry.mjs
Restart=always
RestartSec=5
Environment=PORT=$WEB_PORT
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable my-crate-api my-crate-webhook my-crate-web
sudo systemctl restart my-crate-api my-crate-webhook my-crate-web

# ── Nginx ──────────────────────────────────────────────────
log "Configuring Nginx..."

sudo tee /etc/nginx/sites-available/my-crate > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://localhost:$API_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /webhook {
        proxy_pass http://localhost:$WEBHOOK_PORT/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location / {
        proxy_pass http://localhost:$WEB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/my-crate /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# ── Done ───────────────────────────────────────────────────
echo ""
log "MY-CRATE is live!"
echo -e "  ${YELLOW}→${NC} http://$(curl -s ifconfig.me 2>/dev/null || echo '<your-server-ip>')"
echo ""
echo -e "  Services:  ${GREEN}sudo systemctl status my-crate-api my-crate-webhook my-crate-web${NC}"
echo -e "  Logs:      ${GREEN}sudo journalctl -u my-crate-api -f${NC}"
echo ""
warn "Don't forget to set up your GitHub webhook:"
echo "  Payload URL: http://<your-ip>/webhook"
echo "  Secret:      \$WEBHOOK_SECRET from your .env"
echo "  Event:       push"
