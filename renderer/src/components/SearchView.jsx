import { useState, useEffect } from "react";
import { ScreenshotModal } from "./ScreenshotModal";
import { highlight } from "../utils/highlight";

export function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timeout = setTimeout(async () => {
      const found = await window.shard.semanticSearch(query);
      setResults(found);
      setHasSearched(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    window.shard.onScreenshotRemoved(({ filepath }) => {
      setResults((prev) => prev.filter((s) => s.filepath !== filepath));
    });
  }, []);

  return (
    <div className="relative flex h-full overflow-hidden">
      <ScreenshotModal
        screenshot={selected}
        onClose={() => setSelected(null)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Search input */}
        <div
          className="p-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ color: "var(--text-dim)", fontSize: "16px" }}>
              ⌕
            </span>
            <input
              autoFocus
              type="text"
              placeholder="Search screenshot text..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--text-primary)",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  color: "var(--text-dim)",
                  fontSize: "14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <p
                style={{
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              >
                Type to search OCR'd text across all screenshots
              </p>
            </div>
          )}

          {hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div style={{ fontSize: "36px", opacity: 0.2 }}>⌕</div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-display)",
                  fontSize: "14px",
                }}
              >
                No results for "{query}"
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  marginBottom: "4px",
                }}
              >
                {results.length} RESULT{results.length !== 1 ? "S" : ""}
              </p>
              {results.map((s) => (
                <div
                  key={s.filepath}
                  onClick={() => setSelected(s)}
                  className="flex gap-3 rounded-lg p-3 cursor-pointer transition-all"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                  }}
                >
                  <img
                    src={`file://${s.filepath}`}
                    alt={s.filename}
                    style={{
                      width: "80px",
                      height: "50px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.filename}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--text-dim)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: "1.5",
                      }}
                    >
                      {highlight(s.ocr_text, query)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
