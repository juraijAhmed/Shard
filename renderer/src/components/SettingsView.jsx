import { useState, useEffect } from "react";
import { ThemePreviewCard } from "./ThemePreviewCard";

export function SettingsView({ applyTheme, currentTheme }) {
  const [folder, setFolder] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  useEffect(() => {
    window.shard.getSetting("watchFolder").then((val) => {
      if (val) setFolder(val);
    });
  }, []);

  async function handleBrowse() {
    const picked = await window.shard.pickFolder();
    if (!picked) return;
    setFolder(picked);
    setIsProcessing(true);
    setProcessedCount(0);
    await window.shard.setSetting("watchFolder", picked);
  }
  useEffect(() => {
    window.shard.onScreenshotAdded(() => {
      setTotalCount((prev) => prev + 1);
    });
    window.shard.onScreenshotOcrDone(() => {
      setProcessedCount((prev) => {
        const next = prev + 1;
        if (next >= totalCount) setIsProcessing(false);
        return next;
      });
    });
  }, [totalCount]);

  const themes = [
    { id: "dark", label: "Dark", description: "Black with teal accents" },
    { id: "navy", label: "Navy", description: "Deep blue with teal accents" },
    { id: "green", label: "Green", description: "Dark with green accents" },
    {
      id: "orange",
      label: "Orange",
      description: "Warm dark with orange accents",
    },
    { id: "red", label: "Red", description: "Dark with red accents" },
    { id: "light", label: "Light", description: "Clean ice blue" },
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px" }}>
      <div
        style={{
          maxWidth: "680px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* Heading */}
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Settings
          </h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--text-dim)",
            }}
          >
            Configure Shard
          </p>
        </div>

        {/* Watch Folder */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "28px",
            background: "var(--bg-raised)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text-primary)",
                marginBottom: "2px",
              }}
            >
              Watch Folder
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-dim)",
              }}
            >
              Shard will monitor this folder for new screenshots
            </p>
          </div>

          {/* Current folder display */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: folder ? "var(--text-secondary)" : "var(--text-dim)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {folder || "No folder selected"}
          </div>

          {/* Browse button */}
          <button
            onClick={handleBrowse}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid var(--accent)",
              background: "var(--accent-glow)",
              color: "var(--accent)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.color = "var(--bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent-glow)";
              e.currentTarget.style.color = "var(--accent)";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M1 3.5C1 2.67 1.67 2 2.5 2H5l1.5 1.5H11.5C12.33 3.5 13 4.17 13 5v5.5C13 11.33 12.33 12 11.5 12h-9C1.67 12 1 11.33 1 10.5V3.5z" />
            </svg>
            {folder ? "Change Folder" : "Choose Folder"}
          </button>

          {folder && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {isProcessing ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {/* Progress bar */}
                  <div
                    style={{
                      height: "3px",
                      background: "var(--bg-overlay)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "2px",
                        background: "var(--accent)",
                        width:
                          totalCount > 0
                            ? `${(processedCount / totalCount) * 100}%`
                            : "0%",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {/* Spinner */}
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        border: "2px solid var(--accent-dim)",
                        borderTopColor: "var(--accent)",
                        animation: "spin 0.8s linear infinite",
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {totalCount > 0
                        ? `Processing ${processedCount} of ${totalCount} screenshots...`
                        : "Scanning folder..."}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--text-dim)",
                    }}
                  >
                    Watching for new screenshots
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme selector */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "28px",
            background: "var(--bg-raised)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text-primary)",
                marginBottom: "2px",
              }}
            >
              Theme
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-dim)",
              }}
            >
              Choose your preferred colour scheme
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, auto)",
                gap: "20px 24px",
                justifyContent: "start",
              }}
            >
              {["dark", "navy", "green", "orange", "red", "light"].map((t) => (
                <ThemePreviewCard
                  key={t}
                  theme={t}
                  isSelected={currentTheme === t}
                  onClick={() => applyTheme(t)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
