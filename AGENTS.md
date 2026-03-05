# AGENTS.md

## Cursor Cloud specific instructions

This is an Obsidian Publish clone — a self-hosted platform that turns an Obsidian vault into a browsable website. It has four components:

| Component | Directory | Runtime | Port | Start Command |
|-----------|-----------|---------|------|---------------|
| **Indexer** | `indexer/` | Rust | N/A (CLI) | `cargo run --release -- --vault ../vault --db ../data/notes.db` |
| **API** | `api/` | Bun + Hono | 3001 | `bun run index.ts` |
| **Web** | `web/` | Astro + React | 4321 | `npm run dev` |
| **Webhook** | `webhook/` | Rust + Axum | 3002 | See README for env vars |

### Running services

1. **API first** — the web frontend fetches from `http://localhost:3001` at render time. Start the API before the web dev server.
2. **Indexer** — must be run at least once to populate `data/notes.db`. A pre-populated DB ships with the repo, so re-indexing is only needed after vault changes.
3. **Webhook** is optional for local dev.

### Lint / Test / Build

- **Rust lint:** `cargo clippy` in `indexer/` and `webhook/`
- **Rust tests:** `cargo test` in `indexer/` and `webhook/`
- **Astro type check:** `npx astro check` in `web/` (requires `@astrojs/check` and `typescript` — installed as devDependencies)
- **Web build:** `npm run build` in `web/`
- **Web dev:** `npm run dev` in `web/`

### Gotchas

- Bun is not pre-installed in the VM. The update script installs it via `~/.bun/bin`. Make sure `~/.bun/bin` is on `PATH`.
- The indexer Cargo.toml uses `edition = "2024"` which requires Rust 1.85+. The VM's rustup default stable channel satisfies this.
- `npx astro check` will prompt interactively to install `@astrojs/check` if it's missing. Install it via `npm install @astrojs/check typescript` in `web/` before running the check.
- The `rusqlite` crate uses the `bundled` feature, so no system SQLite library is needed.
