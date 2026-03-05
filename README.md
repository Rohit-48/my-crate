# MY-CRATE
my-crate is a lightweight, self-hosted publishing system built for Obsidian users who want full control over their knowledge. It transforms markdown notes into a fast, customizable, and developer-friendly website,without subscription lock-in.


## Progress: Backend completed, Optimization after building frontend

### Indexer

 Reads .md files from vault
 Splits frontmatter / markdown
 Parses YAML — title, description, tags
 Extracts [[wikilinks]]
 Extracts ![[embeds]]
 Extracts headings → ToC
 Detects LaTeX
 Renders markdown → HTML
 Writes to SQLite — notes, links, tags tables
 CLI with --vault and --db flags

### API

 GET /api/notes
 GET /api/notes/:slug
 GET /api/notes/:slug/backlinks
 GET /api/graph
 GET /api/tags
 GET /api/tags/:tag
 GET /api/search

### Webhook

 Listens on port 3002
 Verifies HMAC signature
 Runs git pull on vault
 Spawns indexer


## Things to do, [Optimization]
Indexer  missing

 Parallel processing with rayon — indexer.rs walks files sequentially right now
 Incremental rebuilds — re-indexes everything on every run, not just changed files
 graph.rs — we handle links in db.rs directly, graph.rs is empty
 Search index JSON file > we planned to prebuild it, currently the API serves raw notes instead

API missing

 GET /api/search?q= — currently returns all notes, no actual search query handling

