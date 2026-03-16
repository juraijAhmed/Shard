import { useState } from "react";
import logo from "../../public/logo.png";

export function LicenseView({ onActivated }) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleActivate() {
    if (!key.trim()) return;
    setLoading(true);
    setError("");
    const result = await window.shard.activateLicense(key.trim());
    setLoading(false);
    if (result.success) {
      onActivated();
    } else {
      setError(result.error);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleActivate();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        // Allow dragging the window from this screen
        WebkitAppRegion: "drag",
      }}
    >
      {/* Draggable title bar with close button */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 8px",
          WebkitAppRegion: "drag",
        }}
      >
        <button
          onClick={() => window.shard.close()}
          style={{
            WebkitAppRegion: "no-drag",
            width: "28px",
            height: "28px",
            borderRadius: "6px",
            background: "transparent",
            border: "none",
            color: "var(--text-dim)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e8112322";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          width: "100%",
          maxWidth: "400px",
          padding: "0 24px",
          WebkitAppRegion: "no-drag",
        }}
      >
        {/* Logo + name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <img
            src={logo}
            alt="Shard"
            style={{ width: "56px", height: "auto" }}
          />
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "0.2em",
              margin: 0,
            }}
          >
            SHARD
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            width: "100%",
            background: "var(--bg-raised)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: "0 0 6px",
              }}
            >
              Enter your license key
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-dim)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              You received your license key by email after purchase.
            </p>
          </div>

          {/* Input */}
          <input
            type="text"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            disabled={loading}
            style={{
              width: "100%",
              background: "var(--bg-overlay)",
              border: `1px solid ${error ? "#f87171" : "var(--border)"}`,
              borderRadius: "8px",
              padding: "10px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--text-primary)",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            autoFocus
          />

          {/* Error */}
          {error && (
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "#f87171",
                margin: "-6px 0 0",
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}

          {/* Activate button */}
          <button
            onClick={handleActivate}
            disabled={loading || !key.trim()}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              background:
                loading || !key.trim() ? "var(--bg-overlay)" : "var(--accent)",
              color: loading || !key.trim() ? "var(--text-dim)" : "var(--bg)",
              border: "none",
              fontFamily: "var(--font-display)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: loading || !key.trim() ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ animation: "spin 0.7s linear infinite" }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Activating...
              </>
            ) : (
              "Activate Shard"
            )}
          </button>
        </div>

        {/* Footer link */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-dim)",
            margin: 0,
            textAlign: "center",
          }}
        >
          Don't have a license?{" "}
          <button
            onClick={() => window.shard.openUrl("https://shard-app.vercel.app")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--accent)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
            }}
          >
            Get Shard →
          </button>
        </p>
      </div>
    </div>
  );
}
