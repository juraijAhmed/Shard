import { useState, useEffect } from "react";
import { ScreenshotModal } from "./ScreenshotModal";
import { highlight } from "../utils/highlight";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
    </svg>
  );
}

function TagPill({ tag, isUser }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: "9px",
      color: isUser ? "var(--text-secondary)" : "var(--accent)",
      background: isUser ? "var(--bg-overlay)" : "var(--accent-glow)",
      border: `1px solid ${isUser ? "var(--border)" : "var(--accent-dim)"}`,
      borderRadius: "3px",
      padding: "1px 5px",
    }}>
      {isUser ? "# " : ""}{tag}
    </span>
  )
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const found = await window.shard.semanticSearch(query);
      setResults(found);
      setHasSearched(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    window.shard.onScreenshotRemoved(({ filepath }) => {
      setResults((prev) => prev.filter((s) => s.filepath !== filepath));
    });
    window.shard.onScreenshotTagged(({ filepath, aiTags, aiDescription }) => {
      setResults((prev) => prev.map((s) =>
        s.filepath === filepath ? { ...s, ai_tags: aiTags, ai_description: aiDescription } : s
      ));
    });
  }, []);

  function handleTagsUpdated(filepath, userTags) {
    setResults((prev) => prev.map((s) =>
      s.filepath === filepath ? { ...s, user_tags: userTags } : s
    ));
    if (selected?.filepath === filepath) {
      setSelected((prev) => ({ ...prev, user_tags: userTags }));
    }
  }

  return (
    <div className="relative flex h-full overflow-hidden">
      <ScreenshotModal
        screenshot={selected}
        onClose={() => setSelected(null)}
        onTagsUpdated={handleTagsUpdated}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div style={{ padding: "28px 28px 20px 28px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            Search
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px" }}>
            Semantic + keyword search across all screenshots
          </p>

          {/* Search input */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "var(--bg-overlay)", border: "1px solid var(--border)",
            borderRadius: "10px", padding: "10px 14px", transition: "border-color 0.15s ease",
          }}>
            <span style={{ color: "var(--accent)", flexShrink: 0 }}><SearchIcon /></span>
            <input
              autoFocus
              type="text"
              placeholder="Try 'blue t-shirt' or 'invoice from march'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: "var(--font-display)", fontSize: "13px", color: "var(--text-primary)",
              }}
            />
            {loading && (
              <div style={{
                width: "14px", height: "14px", borderRadius: "50%",
                border: "2px solid var(--border)", borderTopColor: "var(--accent)",
                animation: "spin 0.7s linear infinite", flexShrink: 0,
              }} />
            )}
            {query && !loading && (
              <button onClick={() => setQuery("")} style={{ color: "var(--text-dim)", fontSize: "14px", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                ✕
              </button>
            )}
          </div>

          {/* AI badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "10px" }}>
            <span style={{ color: "var(--accent)", display: "flex", alignItems: "center" }}><SparkleIcon /></span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.04em" }}>
              AI-powered semantic search — finds meaning, not just keywords
            </span>
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "20px 28px 28px 28px" }}>

          {/* Empty state */}
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4" style={{ opacity: 0.6 }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px",
                background: "var(--bg-overlay)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)",
              }}>
                <SearchIcon />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Search anything
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                  Search by content, tags, URLs, or describe<br />what you remember seeing
                </p>
              </div>
            </div>
          )}

          {/* No results */}
          {hasSearched && results.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div style={{ fontSize: "36px", opacity: 0.15 }}>◌</div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)" }}>
                No results found
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)" }}>
                Nothing matched "{query}"
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.08em" }}>
                  {results.length} RESULT{results.length !== 1 ? "S" : ""}
                </p>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>

              {results.map((s) => {
                const aiTags = s.ai_tags ? s.ai_tags.split(",").map(t => t.trim()).filter(Boolean) : []
                const userTags = s.user_tags ? s.user_tags.split(",").map(t => t.trim()).filter(Boolean) : []
                const hasAnyTags = aiTags.length > 0 || userTags.length > 0

                return (
                  <div
                    key={s.filepath}
                    onClick={() => setSelected(s)}
                    style={{
                      display: "flex", gap: "12px", borderRadius: "10px", padding: "12px",
                      cursor: "pointer", background: "transparent", border: "1px solid var(--border)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--bg-overlay)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Thumbnail */}
                    <div style={{ flexShrink: 0, position: "relative" }}>
                      <img
                        src={`file://${s.filepath}`}
                        alt={s.filename}
                        style={{ width: "96px", height: "60px", objectFit: "cover", borderRadius: "6px", display: "block" }}
                      />
                      {!!s.pinned && (
                        <div style={{
                          position: "absolute", top: "4px", right: "4px", width: "16px", height: "16px",
                          borderRadius: "3px", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="var(--bg)" stroke="none">
                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.filename}
                        </p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {new Date(s.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      {/* Tags — AI and user shown separately */}
                      {hasAnyTags && (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {aiTags.slice(0, 3).map(tag => <TagPill key={tag} tag={tag} isUser={false} />)}
                          {userTags.slice(0, 3).map(tag => <TagPill key={tag} tag={tag} isUser={true} />)}
                        </div>
                      )}

                      {/* OCR preview */}
                      {s.ocr_text && s.ocr_text.trim() && (
                        <p style={{
                          fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          overflow: "hidden", lineHeight: "1.6",
                        }}>
                          {highlight(s.ocr_text, query)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}