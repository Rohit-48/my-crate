import { useState, useEffect, useRef } from "react";
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
    if (!Array.isArray(resultList)) {
      continue;
    }

    for (const hit of resultList) {
      const id =
        typeof hit === "string" || typeof hit === "number"
          ? String(hit)
          : hit?.id
            ? String(hit.id)
            : hit?.doc?.slug;
      if (!id || seen.has(id)) {
        continue;
      }

      const fallbackDoc = notesBySlug.get(id);
      const title =
        (typeof hit === "object" && hit?.doc?.title) ||
        fallbackDoc?.title ||
        id;
      const description =
        (typeof hit === "object" && hit?.doc?.description) ||
        fallbackDoc?.description;

      seen.add(id);
      deduped.push({ slug: id, title, description });
    }
  }

  return deduped;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const indexRef = useRef<any>(null);
  const notesRef = useRef<Note[]>([]);

  useEffect(() => {
    // build search index on mount
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
          // @ts-expect-error Note shape matches DocumentData; FlexSearch DocumentData is strict
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
  }, [query]);

  const showDropdown = (open || query.length > 0) && results.length > 0;

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search notes..."
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        className="w-full px-3 py-2 text-sm bg-neutral-800/50 border border-yellow-500 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 transition-colors"
      />
      {showDropdown && (
        <ul
          className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden z-50 shadow-xl max-h-64 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.map((r) => (
            <li key={r.slug}>
              <a
                href={`/notes/${r.slug}`}
                className="block px-3 py-2.5 hover:bg-neutral-800 transition-colors"
              >
                <span className="text-sm font-medium text-white">{r.title}</span>
                {r.description && (
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">{r.description}</p>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
