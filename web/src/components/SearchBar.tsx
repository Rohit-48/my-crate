import { useState, useEffect, useRef, useCallback } from "react";
import FlexSearch from "flexsearch";

interface Note {
  slug: string;
  title: string;
  description?: string;
  tags: string[];
  raw_md: string;
}

interface SearchResult {
  slug: string;
  title: string;
  description?: string;
  preview?: string;
}

type FlexSearchHit =
  | string
  | number
  | {
      id?: string | number;
      doc?: {
        slug?: string;
        title?: string;
        description?: string;
      };
    };

function toSearchResults(raw: unknown, allNotes: Note[]): SearchResult[] {
  const notesBySlug = new Map<string, Note>(allNotes.map((n) => [n.slug, n]));
  const buckets = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, unknown>)
      : [];

  const seen = new Set<string>();
  const deduped: SearchResult[] = [];

  for (const bucket of buckets) {
    const resultList = (bucket as { result?: FlexSearchHit[] })?.result;
    if (!Array.isArray(resultList)) continue;

    for (const hit of resultList) {
      const id =
        typeof hit === "string" || typeof hit === "number"
          ? String(hit)
          : hit?.id
            ? String(hit.id)
            : hit?.doc?.slug;
      if (!id || seen.has(id)) continue;

      const fallbackDoc = notesBySlug.get(id);
      const title =
        (typeof hit === "object" && hit?.doc?.title) ||
        fallbackDoc?.title ||
        id;
      const description =
        (typeof hit === "object" && hit?.doc?.description) ||
        fallbackDoc?.description;

      const rawMd = fallbackDoc?.raw_md || "";
      const firstLine = rawMd
        .split("\n")
        .find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---"));
      const preview = firstLine?.slice(0, 80) || description?.slice(0, 80) || "";

      seen.add(id);
      deduped.push({ slug: id, title, description, preview });
    }
  }

  return deduped;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        style={{
          background: "var(--accent)",
          color: "#000",
          borderRadius: "2px",
          padding: "0 2px",
        }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const indexRef = useRef<any>(null);
  const notesRef = useRef<Note[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/search")
      .then((r) => r.json())
      .then((notes: Note[]) => {
        notesRef.current = notes;
        const index = new FlexSearch.Document({
          document: {
            id: "slug",
            index: ["title", "raw_md", "tags"],
            store: ["slug", "title", "description"],
          },
        });
        notes.forEach((note) => {
          // @ts-expect-error Note shape matches DocumentData
          index.add(note);
        });
        indexRef.current = index;
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!query.trim() || !indexRef.current) {
      setResults([]);
      return;
    }
    const raw = indexRef.current.search(query, { enrich: true, limit: 6 });
    setResults(toSearchResults(raw, notesRef.current));
    setSelectedIndex(-1);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        window.location.href = `/notes/${results[selectedIndex].slug}`;
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [results, selectedIndex],
  );

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("li");
      items[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const showDropdown = (open || query.length > 0) && results.length > 0;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        placeholder="search notes..."
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "3px",
          padding: "7px 10px",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--text)",
          outline: "none",
          transition: "border-color 0.1s",
        }}
        onFocusCapture={(e) => {
          (e.target as HTMLInputElement).style.borderColor =
            "var(--accent-border)";
        }}
        onBlurCapture={(e) => {
          (e.target as HTMLInputElement).style.borderColor = "var(--border)";
        }}
      />
      {showDropdown && (
        <ul
          ref={listRef}
          className="animate-slide-down"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 3px 3px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            maxHeight: "320px",
            overflowY: "auto",
            zIndex: 50,
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((r, i) => (
            <li
              key={r.slug}
              style={{
                padding: "10px 12px",
                borderBottom:
                  i < results.length - 1
                    ? "1px solid var(--border-dim)"
                    : "none",
                background:
                  i === selectedIndex ? "var(--bg-hover)" : "transparent",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <a
                href={`/notes/${r.slug}`}
                style={{ display: "block", textDecoration: "none" }}
              >
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--text)",
                  }}
                >
                  {highlightMatch(r.title, query)}
                </span>
                {r.preview && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.preview}
                  </p>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
