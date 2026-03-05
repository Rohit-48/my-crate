# MY-CRATE
my-crate is a lightweight, self-hosted publishing system built for Obsidian users who want full control over their knowledge. It transforms markdown notes into a fast, customizable, and developer-friendly website,without subscription lock-in.


## Progress
**Indexer is 100% done.**
- Reads any .md file from the vault
- Splits frontmatter from content
- Extracts title, description, tags from YAML
- Extracts [[wikilinks]] and ![[embeds]] with regex
- Builds table of contents from headings
- Detects LaTeX
- Renders markdown to HTML
- Writes everything to SQLite in one transaction
- CLI with --vault and --db flags

GET /api/notes              ✅ list all notes
GET /api/notes/:slug        ✅ full note with html, toc, frontmatter
GET /api/notes/:slug/backlinks ✅ backlinks
GET /api/graph              ✅ nodes + edges for D3
GET /api/tags               ✅ all tags with counts
GET /api/tags/:tag          ✅ notes by tag
GET /api/search             ✅ full notes list for flexsearch
