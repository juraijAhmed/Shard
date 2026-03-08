import { useState, useEffect } from "react";

// Custom titlebar — replaces native frame
function useTheme() {
  const [theme, setTheme] = useState('dark')

  function applyTheme(t) {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    window.shard.setSetting('theme', t)
  }

  useEffect(() => {
    window.shard.getSetting('theme').then((saved) => {
      const t = saved || 'dark'
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
    })
  }, [])

  return { theme, applyTheme }
}
function highlight(text, query) {
  if (!text || !query) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        style={{
          background: "var(--accent)",
          color: "#0e0e0f",
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
function cleanOcrUrl(url) {
  return url
    .replace(/\s+/g, "")
    .replace(/[""'']/g, "")
    .replace(/\\+/g, "/");
}

function extractUrlsFromText(text) {
  if (!text) return [];

  const withProtocol =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;
  const bareUrl =
    /\b((?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|app|co|uk|gov|edu|me|gg)(?:\/[-a-zA-Z0-9()@:%_+.~#?&/=]*)?)/g;

  const found = new Set();

  const full = text.match(withProtocol) || [];
  full.forEach((u) => found.add(u));

  const bare = text.match(bareUrl) || [];
  bare.forEach((u) => {
    const cleaned = cleanOcrUrl(u);
    const alreadyCovered = [...found].some((f) => f.includes(cleaned));
    if (!alreadyCovered) found.add(`https://${cleaned}`);
  });

  return [...found];
}
function TitleBar({ theme, onToggleTheme }) {
  return (
    <div
      className="flex items-center justify-between px-4 h-10 shrink-0"
      style={{
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Logo */}
      <div style={{ WebkitAppRegion: 'no-drag' }}>
        <img
          src="/logo.png"
          alt="Shard"
          style={{ height: '24px', width: 'auto', display: 'block' }}
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-dim)', fontSize: '13px' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title={theme === 'dark' ? 'Switch to Navy' : theme === 'navy' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'light' ? '☽' : '☀'}
        </button>

        {/* Window controls */}
        <button
          onClick={() => window.shard?.minimize()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor"><rect width="10" height="1" /></svg>
        </button>
        <button
          onClick={() => window.shard?.maximize()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="8" height="8" /></svg>
        </button>
        <button
          onClick={() => window.shard?.close()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-dim)' }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="0" y1="0" x2="9" y2="9" /><line x1="9" y1="0" x2="0" y2="9" /></svg>
        </button>
      </div>
    </div>
  )
}
function ScreenshotModal({ screenshot, onClose }) {
  const [copiedUrl, setCopiedUrl] = useState(null);
  if (!screenshot) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          width: "680px",
          maxWidth: "90vw",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative" }}>
          <img
            src={`file://${screenshot.filepath}`}
            alt={screenshot.filename}
            style={{
              width: "100%",
              maxHeight: "420px",
              objectFit: "contain",
              background: "#000",
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Meta */}
        <div
          className="flex gap-6 p-4 overflow-y-auto"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div
            className="flex flex-col gap-3 shrink-0"
            style={{ minWidth: "140px" }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  marginBottom: "2px",
                }}
              >
                FILENAME
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  wordBreak: "break-all",
                }}
              >
                {screenshot.filename}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  marginBottom: "2px",
                }}
              >
                DATE
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}
              >
                {new Date(screenshot.timestamp).toLocaleString()}
              </p>
            </div>
            {screenshot.ai_tags && (
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-dim)",
                    marginBottom: "6px",
                  }}
                >
                  TAGS
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {screenshot.ai_tags.split(",").map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--accent)",
                        background: "rgba(232,255,71,0.08)",
                        border: "1px solid rgba(232,255,71,0.2)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* URLs */}
          {(() => {
            const urls = extractUrlsFromText(screenshot.ocr_text);
            if (urls.length === 0) return null;
            return (
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-dim)",
                    marginBottom: "6px",
                  }}
                >
                  URLS FOUND
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {urls.map((url) => (
                    <button
                      key={url}
                      onClick={() => {
                        window.shard.copyToClipboard(url);
                        setCopiedUrl(url);
                        setTimeout(() => setCopiedUrl(null), 2000);
                      }}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--accent)",
                        background: "rgba(232,255,71,0.08)",
                        border: "1px solid rgba(232,255,71,0.2)",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                      }}
                      title={url}
                    >
                      {copiedUrl === url ? "✓ Copied" : url}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          {screenshot.ocr_text && (
            <div className="flex-1 overflow-y-auto">
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  marginBottom: "4px",
                }}
              >
                EXTRACTED TEXT
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {screenshot.ocr_text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sidebar nav
function Sidebar({ activeView, setActiveView }) {
  const navItems = [
    { id: "gallery", label: "Gallery", icon: "⊞" },
    { id: "search", label: "Search", icon: "⌕" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div
      className="flex flex-col py-4 gap-1 shrink-0"
      style={{
        width: "56px",
        borderRight: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          title={item.label}
          className="mx-2 h-10 rounded flex items-center justify-center text-lg transition-all"
          style={{
            color: activeView === item.id ? "var(--accent)" : "var(--text-dim)",
            background:
              activeView === item.id ? "var(--bg-overlay)" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (activeView !== item.id)
              e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            if (activeView !== item.id)
              e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}

// Placeholder views
function GalleryView() {
  const [screenshots, setScreenshots] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    window.shard.getAll().then(setScreenshots);

    window.shard.onScreenshotAdded((data) => {
      setScreenshots((prev) => [data, ...prev]);
    });

    window.shard.onScreenshotOcrDone(({ filepath, ocrText }) => {
      setScreenshots((prev) =>
        prev.map((s) =>
          s.filepath === filepath ? { ...s, ocr_text: ocrText } : s,
        ),
      );
    });
  }, []);

  // Group screenshots by date
  const grouped = screenshots.reduce((acc, s) => {
    const date = new Date(s.timestamp);
    const key = date.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  if (screenshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div style={{ fontSize: "48px", opacity: 0.2 }}>⊞</div>
        <p
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-display)",
            fontSize: "14px",
          }}
        >
          No screenshots yet
        </p>
        <p
          style={{
            color: "var(--text-dim)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
          }}
        >
          Set a watch folder in Settings to get started
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      <ScreenshotModal
        screenshot={selected}
        onClose={() => setSelected(null)}
      />
      <div className="h-full overflow-y-auto p-4">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-6">
            {/* Date header */}
            <div
              className="flex items-center gap-3 mb-3"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                paddingTop: "4px",
                paddingBottom: "8px",
                background: "var(--bg-raised)",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--accent)",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                }}
              >
                {date}
              </p>
              <div
                style={{ flex: 1, height: "1px", background: "var(--border)" }}
              />
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  whiteSpace: "nowrap",
                }}
              >
                {items.length} screenshot{items.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Grid for this date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              {items.map((s) => (
                <div
                  key={s.filepath}
                  onClick={() => setSelected(s)}
                  className="rounded-lg overflow-hidden cursor-pointer transition-all"
                  style={{
                    border: "2px solid var(--border)",
                    background: "var(--bg-overlay)",
                    aspectRatio: "16/10",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--accent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <img
                    src={`file://${s.filepath}`}
                    alt={s.filename}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function SearchView() {
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
      const found = await window.shard.search(query);
      setResults(found);
      setHasSearched(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

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
function SettingsView({ applyTheme, currentTheme }) {
  const [folder, setFolder] = useState('')

  useEffect(() => {
    window.shard.getSetting('watchFolder').then((val) => {
      if (val) setFolder(val)
    })
  }, [])

  async function handleBrowse() {
    const picked = await window.shard.pickFolder()
    if (!picked) return
    setFolder(picked)
    await window.shard.setSetting('watchFolder', picked)
  }

  const themes = [
    { id: 'dark',  label: 'Dark',  description: 'Black with teal accents' },
    { id: 'navy',  label: 'Navy',  description: 'Deep blue with teal accents' },
    { id: 'light', label: 'Light', description: 'Clean ice blue (You need help)' },
  ]

  return (
    <div className="flex flex-col p-8 gap-6 h-full overflow-y-auto">
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', color: 'var(--text-primary)' }}>
          Settings
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
          Configure Shard
        </p>
      </div>

      {/* Watch folder */}
      <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Watch Folder
        </p>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 rounded px-3 py-2"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: folder ? 'var(--text-primary)' : 'var(--text-dim)',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {folder || 'Not set'}
          </div>
          <button
            onClick={handleBrowse}
            className="px-3 py-2 rounded transition-opacity hover:opacity-80"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Browse
          </button>
        </div>
        {folder && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            ✓ Watching for new screenshots
          </p>
        )}
      </div>

      {/* Theme selector */}
      <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Theme
        </p>
        <div className="flex flex-col gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 transition-all text-left"
              style={{
                border: currentTheme === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: currentTheme === t.id ? 'var(--accent-glow)' : 'var(--bg-overlay)',
                cursor: 'pointer',
              }}
            >
              {/* Colour swatch */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                flexShrink: 0,
                background: t.id === 'dark' ? '#0e0e0f' : t.id === 'navy' ? '#0a0f14' : '#f0f7fa',
                border: '2px solid',
                borderColor: t.id === 'light' ? '#b8dde8' : '#00b4d8',
              }} />
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-primary)', fontWeight: currentTheme === t.id ? 600 : 400 }}>
                  {t.label}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                  {t.description}
                </p>
              </div>
              {currentTheme === t.id && (
                <div style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: '14px' }}>✓</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
const views = {
  gallery: GalleryView,
  search: SearchView,
  settings: SettingsView,
};

export default function App() {
  const [activeView, setActiveView] = useState('gallery')
  const { theme, applyTheme } = useTheme()
  const ActiveView = views[activeView]

  return (
    <div className="flex flex-col h-full">
      <TitleBar theme={theme} onToggleTheme={() => {
        const next = theme === 'dark' ? 'navy' : theme === 'navy' ? 'light' : 'dark'
        applyTheme(next)
      }} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
          <ActiveView applyTheme={applyTheme} currentTheme={theme} />
        </main>
      </div>
    </div>
  )
}