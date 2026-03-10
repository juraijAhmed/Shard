import { useState, useEffect } from "react";
import { ScreenshotModal } from "./ScreenshotModal";

function PinIcon({ filled, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

function ScreenshotTile({ s, onClick, onPin }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(s)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; setHovered(true); }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; setHovered(false); }}
      style={{
        border: "2px solid var(--border)", background: "var(--bg-overlay)",
        aspectRatio: "16/10", borderRadius: "8px", overflow: "hidden",
        cursor: "pointer", position: "relative", transition: "border-color 0.15s ease",
      }}
    >
      <img src={`file://${s.filepath}`} alt={s.filename}
        style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {(hovered || !!s.pinned) && (
        <button
          onClick={(e) => { e.stopPropagation(); onPin(s); }}
          title={s.pinned ? "Unpin" : "Pin"}
          style={{
            position: "absolute", top: "6px", right: "6px",
            width: "24px", height: "24px", borderRadius: "4px",
            background: s.pinned ? "var(--accent)" : "rgba(0,0,0,0.55)",
            color: s.pinned ? "var(--bg)" : "white",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          <PinIcon filled={!!s.pinned} size={12} />
        </button>
      )}

      {s.ocr_status === "pending" && (
        <div style={{
          position: "absolute", bottom: "6px", right: "6px",
          width: "16px", height: "16px", borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.2)",
          borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite",
        }} />
      )}
    </div>
  );
}

export function GalleryView() {
  const [screenshots, setScreenshots] = useState([]);
  const [selected, setSelected] = useState(null);

  const pinnedScreenshots = screenshots.filter((s) => s.pinned);
  const rest = screenshots.filter((s) => !s.pinned);

  const grouped = rest.reduce((acc, s) => {
    const date = new Date(s.timestamp);
    const key = date.toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const allScreenshots = [...pinnedScreenshots, ...Object.values(grouped).flat()];
  const selectedIndex = selected
    ? allScreenshots.findIndex((s) => s.filepath === selected.filepath)
    : -1;

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (!selected) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = allScreenshots[selectedIndex + 1];
        if (next) setSelected(next);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = allScreenshots[selectedIndex - 1];
        if (prev) setSelected(prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, selectedIndex, allScreenshots]);

  // Data listeners — run once on mount
  useEffect(() => {
    window.shard.getAll().then(setScreenshots);

    window.shard.onScreenshotRemoved(({ filepath }) => {
      setScreenshots((prev) => prev.filter((s) => s.filepath !== filepath));
    });

    window.shard.onScreenshotAdded((data) => {
      setScreenshots((prev) => {
        if (prev.some((s) => s.filepath === data.filepath)) return prev;
        return [data, ...prev];
      });
    });

    window.shard.onScreenshotOcrDone(({ filepath, ocrText }) => {
      setScreenshots((prev) =>
        prev.map((s) =>
          s.filepath === filepath ? { ...s, ocr_text: ocrText, ocr_status: "done" } : s
        )
      );
    });

    window.shard.onScreenshotTagged(({ filepath, aiTags, aiDescription }) => {
      setScreenshots((prev) =>
        prev.map((s) =>
          s.filepath === filepath
            ? { ...s, ai_tags: aiTags, ai_description: aiDescription }
            : s
        )
      );
    });
  }, []);

  function handlePin(s) {
    window.shard.togglePin(s.filepath).then((newVal) => {
      setScreenshots((prev) =>
        prev.map((x) => x.filepath === s.filepath ? { ...x, pinned: newVal ? 1 : 0 } : x)
      );
      if (selected?.filepath === s.filepath) {
        setSelected((prev) => ({ ...prev, pinned: newVal ? 1 : 0 }));
      }
    });
  }

  if (screenshots.length === 0) {
    return (
      <div className="flex flex-col h-full" style={{ padding: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
          Your Screenshots
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-dim)" }}>
          No screenshots yet
        </p>
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div style={{ fontSize: "48px", opacity: 0.15 }}>⊞</div>
          <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600 }}>
            Nothing here yet
          </p>
          <p style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            Set a watch folder in Settings to get started
          </p>
        </div>
      </div>
    );
  }

  const Grid = ({ items }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
      {items.map((s) => (
        <ScreenshotTile key={s.filepath} s={s} onClick={setSelected} onPin={handlePin} />
      ))}
    </div>
  );

  const SectionHeader = ({ label, count }) => (
    <div className="flex items-center gap-3 mb-3" style={{
      position: "sticky", top: 0, zIndex: 10,
      paddingTop: "6px", paddingBottom: "10px", background: "var(--bg-raised)",
    }}>
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)",
        letterSpacing: "0.05em", whiteSpace: "nowrap",
        display: "flex", alignItems: "center", gap: "6px",
      }}>
        {label}
      </p>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)", whiteSpace: "nowrap" }}>
        {count} screenshot{count !== 1 ? "s" : ""}
      </p>
    </div>
  );

  return (
    <div className="relative h-full overflow-hidden">
      <ScreenshotModal
        screenshot={selected}
        onClose={() => setSelected(null)}
        onTagsUpdated={(filepath, userTags) => {
          setScreenshots((prev) =>
            prev.map((s) => s.filepath === filepath ? { ...s, user_tags: userTags } : s)
          );
          setSelected((prev) => ({ ...prev, user_tags: userTags }));
        }}
        onPinToggled={(filepath, isPinned) => {
          setScreenshots((prev) =>
            prev.map((s) => s.filepath === filepath ? { ...s, pinned: isPinned ? 1 : 0 } : s)
          );
          setSelected((prev) => ({ ...prev, pinned: isPinned ? 1 : 0 }));
        }}
      />

      <div className="h-full overflow-y-auto">
        <div style={{ padding: "28px 28px 8px 28px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
            Your Screenshots
          </h1>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-dim)" }}>
            {screenshots.length} screenshot{screenshots.length !== 1 ? "s" : ""}{" "}
            across {Object.keys(grouped).length} day{Object.keys(grouped).length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ padding: "16px 28px 28px 28px" }}>
          {pinnedScreenshots.length > 0 && (
            <div className="mb-8">
              <SectionHeader label={<><PinIcon filled size={11} /> PINNED</>} count={pinnedScreenshots.length} />
              <Grid items={pinnedScreenshots} />
            </div>
          )}

          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-8">
              <SectionHeader label={date} count={items.length} />
              <Grid items={items} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}