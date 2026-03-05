# MY-CRATE

> Self-hosted publishing for your Obsidian vault. No subscriptions, no lock-in, full control.

Obsidian Publish is a fast, self-hosted platform that transforms your Obsidian vault into a beautiful, browsable website. It indexes your markdown files, serves them via a REST API, and provides a modern web frontend with search, backlinks, and interactive graph visualization.

---

## Features

- **Instant Search** — Full-text search with FlexSearch, no backend query needed
- **Backlinks** — Automatically discover linked references between notes
- **Interactive Graph** — D3-powered force-directed graph of your note relationships
- **LaTeX Support** — Renders math expressions with KaTeX
- **Table of Contents** — Auto-generated ToC from headings, sticky sidebar navigation
- **Tag System** — Browse notes by tags with dedicated tag pages
- **Git Webhook** — Auto-reindex on push with HMAC verification
- **Mobile-First** — Responsive design with hamburger navigation

---

## Quick Start

Get a local instance running in under 5 minutes.

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Rust](https://rustup.rs/) | 1.70+ | Indexer & webhook |
| [Bun](https://bun.sh/) | 1.0+ | API server |
| [Node.js](https://nodejs.org/) | 20+ | Frontend build |

### 1. Clone and Setup

```bash
git clone <repository>
cd obsidian-publish

# Create data directory
mkdir -p data
```

### 2. Index Your Vault

```bash
cd indexer
cargo run --release -- \
  --vault ../vault \
  --db ../data/notes.db
```

The indexer parses all `.md` files, extracts frontmatter, wikilinks, and generates HTML.

### 3. Start All Services

From the project root:

```bash
./start.sh
```

This starts three services:

| Service | Port | Description |
|---------|------|-------------|
| API | 3001 | Hono.js REST API |
| Web | 4321 | Astro dev server |
| Webhook | 3002 | Git push listener |

Visit `http://localhost:4321` to see your published vault.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vault/    │────▶│  Indexer    │────▶│  SQLite DB  │
│   .md files │     │    (Rust)   │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                        ┌──────────────────────┘
                        ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Webhook   │────▶│  Hono API   │◀────│   Astro     │
│   (Rust)    │     │   (Bun)     │     │  Frontend   │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                            │
       └────────────────────────────────────────────┘
                    Git push triggers reindex
```

### Components

#### Indexer (`/indexer`)

Rust binary that walks your vault and populates the database.

```bash
cargo run --release -- --vault /path/to/vault --db /path/to/db.sqlite
```

**What it indexes:**

- Frontmatter (title, description, tags)
- Markdown → HTML (via `pulldown-cmark`)
- Wikilinks `[[Note Title]]` and embeds `![[Image]]`
- Table of contents from headings
- LaTeX detection (`$...$` and `$$...$$`)

#### API (`/api`)

Hono.js server providing REST endpoints.

```typescript
// Start standalone
cd api && bun run index.ts
```

#### Web (`/web`)

Astro frontend with React islands.

```bash
cd web && npm run dev     # Development
npm run build             # Production build
```

#### Webhook (`/webhook`)

Rust service that listens for git pushes and triggers reindexing.

```bash
cd webhook
WEBHOOK_SECRET=your-secret \
VAULT_PATH=./vault \
DB_PATH=./data/notes.db \
INDEXER_PATH=./indexer/target/release/indexer \
cargo run
```

---

## API Reference

Base URL: `http://localhost:3001`

### List Notes

```http
GET /api/notes
```

```json
[
  {
    "slug": "getting-started",
    "title": "Getting Started",
    "description": "Overview of the platform",
    "tags": ["guide"],
    "has_latex": false
  }
]
```

### Get Note

```http
GET /api/notes/:slug
```

```json
{
  "slug": "getting-started",
  "title": "Getting Started",
  "html": "<p>Welcome...</p>",
  "toc": [
    { "level": "H1", "text": "Getting Started", "anchor": "getting-started" },
    { "level": "H2", "text": "Installation", "anchor": "installation" }
  ],
  "tags": ["guide"],
  "description": "Overview",
  "frontmatter": { "title": "Getting Started" }
}
```

### Get Backlinks

```http
GET /api/notes/:slug/backlinks
```

```json
[
  { "slug": "related-topic", "title": "Related Topic" }
]
```

### Search Index

```http
GET /api/search
```

Returns all notes with `raw_md` field for client-side FlexSearch indexing.

### Graph Data

```http
GET /api/graph
```

```json
{
  "nodes": [{ "slug": "note-1", "title": "Note 1" }],
  "edges": [
    { "source_slug": "note-1", "target_slug": "note-2", "is_embed": 0 }
  ]
}
```

### Tags

```http
GET /api/tags
GET /api/tags/:tag
```

---

## Configuration

### Environment Variables

#### API

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DATABASE_URL` | `./data/notes.db` | SQLite database path |

#### Webhook

| Variable | Required | Description |
|----------|----------|-------------|
| `WEBHOOK_SECRET` | Yes | HMAC secret for verification |
| `VAULT_PATH` | Yes | Path to git repository |
| `DB_PATH` | Yes | Path to SQLite database |
| `INDEXER_PATH` | Yes | Path to indexer binary |
| `PORT` | `3002` | Webhook server port |

#### Web

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://localhost:3001` | API base URL |

---

## Development

### Running Individual Services

```bash
# Terminal 1: API
cd api && bun run index.ts

# Terminal 2: Frontend
cd web && npm run dev

# Terminal 3: Webhook (optional)
cd webhook && WEBHOOK_SECRET=dev VAULT_PATH=./vault DB_PATH=./data/notes.db INDEXER_PATH=../indexer/target/debug/indexer cargo run
```

### Database Schema

The indexer creates these tables:

```sql
notes       -- slug, title, html, raw_md, frontmatter, toc, etc.
links       -- source_slug, target_slug, is_embed
tags        -- tag name
tag_notes   -- tag ↔ note mapping
```

### Adding a New Page

Create `.astro` files in `web/src/pages/`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";

const API = "http://localhost:3001";
const res = await fetch(`${API}/api/notes`);
const notes = await res.json();
---

<BaseLayout title="My Page" notes={notes}>
  <h1>Hello World</h1>
</BaseLayout>
```

---

## Deployment

### Building for Production

```bash
# 1. Build indexer
cd indexer && cargo build --release

# 2. Build webhook
cd webhook && cargo build --release

# 3. Build frontend
cd web && npm run build

# 4. Start production API
cd api && bun run index.ts  # Or use PM2, systemd, etc.
```

### Docker (Example)

```dockerfile
FROM oven/bun:1 as api
WORKDIR /app
COPY api/ .
RUN bun install
EXPOSE 3001
CMD ["bun", "run", "index.ts"]

FROM node:20 as web
WORKDIR /app
COPY web/ .
RUN npm ci && npm run build
EXPOSE 4321
CMD ["npm", "run", "preview"]
```

---

## NixOS Support

This project includes a Nix flake for reproducible development.

```bash
nix develop  # Enter dev shell
```

See [NIXOS_SETUP.md](NIXOS_SETUP.md) for detailed instructions.

---

## Project Structure

```
obsidian-publish/
├── api/              # Hono.js REST API (Bun)
│   ├── index.ts
│   └── routes/
├── web/              # Astro frontend
│   ├── src/
│   │   ├── components/   # React islands
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
├── indexer/          # Rust markdown indexer
│   └── src/
│       ├── main.rs
│       ├── db.rs
│       └── parser.rs
├── webhook/          # Rust git webhook
│   └── src/
│       └── main.rs
├── data/             # SQLite database
├── vault/            # Your Obsidian vault (git repo)
└── start.sh          # Start all services
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `cargo test` (Rust), `npm test` (Web)
5. Submit a pull request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [pulldown-cmark](https://github.com/raphlinus/pulldown-cmark) for Markdown parsing
- [Hono](https://hono.dev/) for the API framework
- [Astro](https://astro.build/) for the frontend architecture
- [D3](https://d3js.org/) for graph visualization
- [FlexSearch](https://github.com/nextapps-de/flexsearch) for client-side search
