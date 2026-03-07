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
          background: "var(--color-accent)",
          color: "#000",
          borderRadius: "1px",
          padding: "0 1px",
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
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
    const raw = indexRef.current.search(query, { enrich: true, limit: 8 });
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
    [results, selectedIndex]
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
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        placeholder="search notes..."
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        onKeyDown={handleKeyDown}
        className="w-full outline-none transition-colors"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
          padding: "7px 10px",
        }}
        onFocusCapture={(e) => {
          (e.target as HTMLInputElement).style.borderColor = "var(--color-accent-border)";
        }}
        onBlurCapture={(e) => {
          (e.target as HTMLInputElement).style.borderColor = "var(--color-border)";
        }}
      />
      <div 
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center rounded"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "10px",
          color: "var(--color-text-faint)",
          background: "var(--color-bg)",
          border: "1px solid var(--color-border-dim)",
          padding: "2px 4px",
        }}
      >
        ⌘K
      </div>
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-y-auto animate-slide-down"
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((r, i) => (
            <li
              key={r.slug}
              style={{
                borderBottom: i < results.length - 1 ? "1px solid var(--color-border-dim)" : "none",
                background: i === selectedIndex ? "var(--color-bg-hover)" : "transparent",
              }}
            >
              <a
                href={`/notes/${r.slug}`}
                className="block transition-colors"
                style={{ padding: "8px 10px", textDecoration: "none" }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span
                  className="block"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-text)",
                  }}
                >
                  {highlightMatch(r.title, query)}
                </span>
                {r.preview && (
                  <p
                    className="truncate"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-text-faint)",
                      marginTop: "2px",
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
