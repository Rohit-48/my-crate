## Project Overview

**Name:** t-browsee  
**Language:** Rust  
**Target Platforms:** Linux, macOS (Windows later)  
**Distribution:** AUR, Homebrew, Nix packages  
**Architecture:** CLI → Search API → LLM API → Formatted Output

[[t-browsee-dashboard]]
----

```
# Project structure
t-browsee/
├── Cargo.toml
├── src/
│   ├── main.rs              # Entry point
│   ├── lib.rs               # Library exports
│   ├── cli.rs               # CLI argument parsing
│   ├── config.rs            # Configuration management
│   ├── search/
│   │   ├── mod.rs           # Search module exports
│   │   ├── duckduckgo.rs    # DuckDuckGo implementation
│   │   └── types.rs         # Search result types
│   ├── llm/
│   │   ├── mod.rs           # LLM module exports
│   │   ├── client.rs        # LLM API client
│   │   ├── providers/
│   │   │   ├── mod.rs
│   │   │   ├── anthropic.rs # Claude integration
│   │   │   ├── openai.rs    # GPT integration
│   │   │   └── gemini.rs    # Gemini integration
│   │   └── types.rs         # LLM request/response types
│   ├── output/
│   │   ├── mod.rs
│   │   └── formatter.rs     # Terminal output formatting
│   └── error.rs             # Custom error types
├── tests/
│   ├── integration_tests.rs
│   └── fixtures/
└── README.md
```

----

## 1. PROJECT REQUIREMENTS

### Features

**Core Features (MVP):**

- ✅ Search the web via DuckDuckGo API
- ✅ Get AI-generated answers from LLM (Gemini/Claude/GPT)
- ✅ Display formatted answers in terminal
- ✅ Store search history locally
- ✅ Manage API keys via config

**Extended Features (v1.0):**

- ✅ Multiple LLM provider support (switch between them)
- ✅ Smart caching (avoid re-querying same thing)
- ✅ History search & management
- ✅ Export history to JSON/Markdown
- ✅ Raw search mode (skip LLM, just show results)
- ✅ Custom terminal width & styling

**Future Features (v2.0+):**

- Interactive mode (follow-up questions)
- Streaming LLM responses (see answer as it generates)
- tmux/vim integration scripts
- Plugin system for custom search engines
- Cost tracking (token usage)
- User ratings (thumbs up/down on answers)

**How it works:**

```
User Input → CLI Parser → Config Loader → Search Engine → LLM API → Formatter → Terminal Output
                                                                    ↓
                                                              History DB
```

----

### Tech Stack

**Language:** Rust (2021 edition)

- Why? Fast, single binary, perfect for CLI tools

**Core Dependencies:**

- `clap` - CLI argument parsing
- `tokio` - Async runtime
- `reqwest` - HTTP client
- `serde` + `serde_json` - Serialization
- `toml` - Config file parsing
- `rusqlite` - SQLite database
- `colored` - Terminal colors
- `textwrap` - Text wrapping
- `dirs` - Cross-platform config paths
- `anyhow` - Error handling
- `chrono` - Timestamps

**APIs:**

- DuckDuckGo Instant Answer API (free, no key)
- Google Gemini API (free tier: 60 req/min)
- Anthropic Claude API (paid)
- OpenAI GPT API (limited free credits)

---

## 2. RESOURCES

### Learning Resources

**Rust Fundamentals:**

- Official Rust Book: [https://doc.rust-lang.org/book/](https://doc.rust-lang.org/book/)
- Rust by Example: [https://doc.rust-lang.org/rust-by-example/](https://doc.rust-lang.org/rust-by-example/)
- Tokio Tutorial: [https://tokio.rs/tokio/tutorial](https://tokio.rs/tokio/tutorial)

**Specific Topics:**

- Async/Await: [https://rust-lang.github.io/async-book/](https://rust-lang.github.io/async-book/)
- Error Handling: [https://doc.rust-lang.org/book/ch09-00-error-handling.html](https://doc.rust-lang.org/book/ch09-00-error-handling.html)
- Traits: [https://doc.rust-lang.org/book/ch10-02-traits.html](https://doc.rust-lang.org/book/ch10-02-traits.html)

**CLI Building:**

- clap documentation: [https://docs.rs/clap/](https://docs.rs/clap/)
- CLI book: [https://rust-cli.github.io/book/](https://rust-cli.github.io/book/)

**API Integration:**

- reqwest docs: [https://docs.rs/reqwest/](https://docs.rs/reqwest/)
- Gemini API: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- Anthropic API: [https://docs.anthropic.com/](https://docs.anthropic.com/)
- OpenAI API: [https://platform.openai.com/docs/](https://platform.openai.com/docs/)

**Database:**

- rusqlite docs: [https://docs.rs/rusqlite/](https://docs.rs/rusqlite/)
- SQLite tutorial: [https://www.sqlitetutorial.net/](https://www.sqlitetutorial.net/)

----

## 3. GOALS

### Outcome-Based Goals

**Resume/Portfolio:**

- ✅ Showcase on GitHub with ⭐ 50+ stars
- ✅ Deployed on AUR, Homebrew, Nix (3 package managers)
- ✅ Real users installing and using it
- ✅ Demonstrates: Rust, API integration, CLI design, packaging

**Social/Community:**

- ✅ Post on r/rust and get positive feedback
- ✅ Someone creates an issue/PR (external contribution)
- ✅ Featured in "This Week in Rust" newsletter (stretch goal)
- ✅ Other developers use it in their workflow

**Personal Use:**

- ✅ You actually use it daily in your own workflow
- ✅ Integrated into your tmux setup
- ✅ Saves you time (measurable: 10+ searches/day)

![[Pasted image 20260216143136.png]]
