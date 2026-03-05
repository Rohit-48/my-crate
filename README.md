# my-crate

Publish your Obsidian vault as a self-hosted website. Indexes markdown to SQLite, serves via REST API, and reindexes on webhook. No subscription lock-in.

---

## Installation

**Prerequisites**

- Rust stable toolchain
- Obsidian vault (local directory or git clone)

**Verify**

```bash
cargo --version
```

For NixOS, see [NIXOS_SETUP.md](NIXOS_SETUP.md).

---

## Quick start

Index a vault and serve the API:

```bash
# Index vault into SQLite
cargo run -p indexer -- --vault ./vault --db ./data/notes.sqlite

# Serve API (api/ uses Bun/Node)
# Start webhook on port 3002
```

---

## Overview

Three components:

| Component | Purpose |
|-----------|---------|
| **indexer** | Walks vault, parses markdown, writes notes/links/tags to SQLite |
| **api** | REST API for notes, backlinks, graph, tags, search |
| **webhook** | Listens for pushes, runs `git pull`, spawns indexer |

---

## Indexer

Reads `.md` files, splits frontmatter and body, parses YAML (title, description, tags), extracts wikilinks and embeds, builds ToC from headings, detects LaTeX, renders markdown to HTML, and writes to SQLite.

**Options**

| Flag | Required | Description |
|------|----------|-------------|
| `--vault` | yes | Path to vault directory |
| `--db` | yes | Path to SQLite database file |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes |
| GET | `/api/notes/:slug` | Note by slug |
| GET | `/api/notes/:slug/backlinks` | Backlinks for note |
| GET | `/api/graph` | Link graph data |
| GET | `/api/tags` | List tags |
| GET | `/api/tags/:tag` | Notes by tag |
| GET | `/api/search` | Search (query not yet implemented) |

---

## Webhook

Listens on port 3002. Verifies HMAC signature, runs `git pull` on the vault repo, and spawns the indexer.

---

## Project structure

```
obsidian-publish/
├── indexer/     # Vault indexer (Rust)
├── api/         # REST API
├── webhook/     # Webhook service (Rust)
└── vault/       # Obsidian vault (optional, submodule or clone)
```

---

## Development

**In progress**

- Frontend (web UI)
- NixOS dev environment ([NIXOS_SETUP.md](NIXOS_SETUP.md))

**Planned**

- Indexer: parallel processing (Rayon), incremental rebuilds, graph.rs consolidation, prebuilt search index
- API: implement `q` parameter for `/api/search`

**Limitations**

- Search endpoint ignores query; returns all notes
- Full rebuild on every index
- Graph logic in db layer; graph.rs unused
