import { useState, useRef, useEffect } from "react";

function ThemeDropdown({ theme, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const themes = [
    { id: "dark", icon: "☽", label: "Dark" },
    { id: "navy", icon: "◈", label: "Navy" },
    { id: "green", icon: "✦", label: "Green" },
    { id: "orange", icon: "◉", label: "Orange" },
    { id: "red", icon: "♦", label: "Red" },
    { id: "light", icon: "☀", label: "Light" },
  ];

  const current = themes.find((t) => t.id === theme);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-7 px-2 w-[30px] rounded flex justify-center items-center gap-1 transition-colors"
        style={{
          color: "var(--text-dim)",
          fontSize: "13px",
          background: open ? "var(--bg-overlay)" : "transparent",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-overlay)")
        }
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
        title="Switch theme"
      >
        <span>{current?.icon}</span>
        <svg
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="currentColor"
          style={{ opacity: 0.5, marginTop: "1px" }}
        >
          <path d="M0 0l4 5 4-5z" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            background: "var(--bg-raised)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "6px",
            zIndex: 100,
            minWidth: "140px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {themes.map((t) => (
  <button
    key={t.id}
    onClick={() => { onSelect(t.id); setOpen(false); }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      padding: "8px 12px",
      borderRadius: "6px",
      background: theme === t.id ? "var(--accent-glow)" : "transparent",
      color: theme === t.id ? "var(--accent)" : "var(--text-secondary)",
      fontFamily: "var(--font-display)",
      fontSize: "13px",
      border: "none",
      cursor: "pointer",
      textAlign: "left",
    }}
    onMouseEnter={(e) => { if (theme !== t.id) e.currentTarget.style.background = "var(--bg-overlay)"; }}
    onMouseLeave={(e) => { if (theme !== t.id) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ width: "18px", textAlign: "center", flexShrink: 0, fontSize: "13px" }}>
      {t.icon}
    </span>
    <span style={{ flex: 1 }}>{t.label}</span>
  </button>
))}
        </div>
      )}
    </div>
  );
}

export function TitleBar({ theme, onToggleTheme }) {
  return (
    <div
      className="flex items-center justify-between px-4 h-10 shrink-0"
      style={{
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        WebkitAppRegion: "drag",
      }}
    >
      {/* Logo */}
      <div style={{ WebkitAppRegion: "no-drag" }}>
        <img
          src="/logo.png"
          alt="Shard"
          style={{
            height: "32px",
            width: "auto",
            display: "block",
            marginInline: "10px",
          }}
        />
      </div>

      {/* Right side controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: "no-drag", marginInline: '10px'}}
      >
        <ThemeDropdown theme={theme} onSelect={onToggleTheme} />

        {/* Minimize */}
        <button
          onClick={() => window.shard?.minimize()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-overlay)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>

        {/* Maximize */}
        <button
          onClick={() => window.shard?.maximize()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-overlay)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="0.5" y="0.5" width="8" height="8" />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={() => window.shard?.close()}
          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#c0392b";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="0" y1="0" x2="9" y2="9" />
            <line x1="9" y1="0" x2="0" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
