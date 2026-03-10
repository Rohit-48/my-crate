# MY-CRATE

Self-hosted publishing platform for your Obsidian vault. Write in Obsidian, push to GitHub, read anywhere.

![MY-CRATE screenshot](images/screenshot.png)

## Why

Most Obsidian publishing solutions are either paid (Obsidian Publish), locked to a platform (Vercel/Netlify with limitations), or too complex to self-host. MY-CRATE runs on any VPS, costs ~$6/month, and gives you full control over your notes.

- Push a note to GitHub → site updates automatically (no manual deploys)
- Full-text search, backlinks, knowledge graph, LaTeX, tags
- Your data stays on your server

## Stack

| Layer | Tech |
|-------|------|
| Indexer | Rust (clap, pulldown-cmark, rusqlite) |
| API | Hono.js (Bun) |
| Webhook | Rust (Axum) |
| Frontend | Astro + React + D3 + Tailwind |
| Database | SQLite |
| Proxy | Nginx |

## Requirements

- A VPS running Ubuntu 22.04 or 24.04 (1GB RAM minimum, $6/mo on DigitalOcean)
- A GitHub account with your Obsidian vault in a repo
- A domain name (optional but recommended)

## Quick start

```bash
git clone https://github.com/Rohit-48/my-crate-
cd my-crate-
cp env.example .env
```

Edit `.env` with your values:

```bash
# Generate a secure webhook secret
openssl rand -hex 32

# Edit .env
WEBHOOK_SECRET=your-generated-secret
SERVICE_USER=your-unix-username   # e.g. ubuntu, void
```

Run setup:

```bash
chmod +x setup.sh
./setup.sh
```

That's it. Your site is live at `http://your-server-ip`.

## What setup.sh does

1. Checks all dependencies are installed
2. Builds the Rust indexer and webhook binaries
3. Installs API and frontend dependencies
4. Runs the indexer to populate the SQLite database from your vault
5. Creates and enables three systemd services (API, webhook, frontend)
6. Configures Nginx as a reverse proxy

## Connecting your Obsidian vault

Your vault lives at `./vault/` inside the repo. Add your markdown files there and commit them, or point it at an existing vault repo via a git submodule.

To auto-update the site when you push:

1. Go to your vault GitHub repo - **Settings - Webhooks - Add webhook**
2. Set **Payload URL** to `https://your-domain.com/webhook`
3. Set **Content type** to `application/json`
4. Set **Secret** to the same value as `WEBHOOK_SECRET` in your `.env`
5. Select **Just the push event**
6. Save

Now every push to your vault repo triggers `git pull` + re-index on the server automatically.

## Adding SSL (recommended)

Once your domain's DNS points to your server:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot handles certificate issuance and auto-renewal.

## Local development

```bash
cp env.example .env
# edit .env - set WEBHOOK_SECRET=dev is fine locally
chmod +x start.sh
./start.sh
```

The dev script starts all three services and watches for changes. Open `http://localhost:4321`.

> **Note:** The webhook runs the debug binary in dev mode (`cargo run`). For production always use `setup.sh` which builds release binaries.

## Services

After setup, three systemd services run your stack:

| Service | Port | Description |
|---------|------|-------------|
| `my-crate-api` | 3001 | Hono.js API, reads SQLite |
| `my-crate-webhook` | 3002 | Rust webhook listener |
| `my-crate-web` | 4321 | Astro SSR frontend |

Useful commands:

```bash
# Check status
sudo systemctl status my-crate-api my-crate-webhook my-crate-web

# View logs
sudo journalctl -u my-crate-api -f

# Restart a service
sudo systemctl restart my-crate-api
```

## Re-indexing manually

If you add notes directly to the server without going through GitHub:

```bash
./indexer/target/release/indexer --vault ./vault --db ./data/notes.db
```

## Configuration

All configuration lives in `.env`. Copy `env.example` to get started.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEBHOOK_SECRET` | Yes | - | Secret to verify GitHub webhook payloads |
| `SERVICE_USER` | Yes | - | Unix user that runs the systemd services |
| `API_PORT` | No | `3001` | Hono API port |
| `WEB_PORT` | No | `4321` | Astro frontend port |
| `WEBHOOK_PORT` | No | `3002` | Webhook listener port |

> **Warning:** Never commit `.env` to git. It's in `.gitignore` by default.

## Firewall (recommended)

Lock down the server to only expose necessary ports:

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

This blocks direct access to internal ports (3001, 3002, 4321).

## License

MIT
