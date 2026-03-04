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
