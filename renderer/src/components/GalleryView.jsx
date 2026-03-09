import { useState, useEffect } from "react";
import { ScreenshotModal } from "./ScreenshotModal";

export function GalleryView() {
  const [screenshots, setScreenshots] = useState([]);
  const [selected, setSelected] = useState(null);

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
          s.filepath === filepath
            ? { ...s, ocr_text: ocrText, ocr_status: "done" }
            : s,
        ),
      );
    });
  }, []);

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
      <div className="flex flex-col h-full" style={{ padding: "28px" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Your Screenshots
        </h1>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--text-dim)",
          }}
        >
          No screenshots yet
        </p>
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div style={{ fontSize: "48px", opacity: 0.15 }}>⊞</div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Nothing here yet
          </p>
          <p
            style={{
              color: "var(--text-dim)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          >
            Set a watch folder in Settings to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      <ScreenshotModal
        screenshot={selected}
        onClose={() => setSelected(null)}
      />
      <div className="h-full overflow-y-auto">
        {/* Welcome header */}
        <div style={{ padding: "28px 28px 8px 28px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "26px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Your Screenshots
          </h1>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-dim)",
            }}
          >
            {screenshots.length} screenshot{screenshots.length !== 1 ? "s" : ""}{" "}
            across {Object.keys(grouped).length} day
            {Object.keys(grouped).length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Groups */}
        <div style={{ padding: "16px 28px 28px 28px" }}>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="mb-8">
              {/* Date header */}
              <div
                className="flex items-center gap-3 mb-3"
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  paddingTop: "6px",
                  paddingBottom: "10px",
                  background: "var(--bg-raised)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--accent)",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {date}
                </p>
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: "var(--border)",
                  }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {items.length} screenshot{items.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                {items.map((s) => (
                  <div
                    key={s.filepath}
                    onClick={() => setSelected(s)}
                    style={{
                      border: "2px solid var(--border)",
                      background: "var(--bg-overlay)",
                      aspectRatio: "16/10",
                      borderRadius: "8px",
                      overflow: "hidden",
                      cursor: "pointer",
                      position: "relative",
                      transition: "border-color 0.15s ease",
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
                    {s.ocr_status === "pending" && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "6px",
                          right: "6px",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.2)",
                          borderTopColor: "var(--accent)",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
