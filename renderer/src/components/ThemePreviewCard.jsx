export function ThemePreviewCard({ theme, isSelected, onClick }) {
  const palettes = {
    dark: {
      bg: "#0e0e0f",
      raised: "#161618",
      overlay: "#1e1e21",
      border: "#2a2a2e",
      accent: "#00b4d8",
      text: "#f0f0f0",
      textDim: "#444450",
    },
    navy: {
      bg: "#0a0f14",
      raised: "#0f1923",
      overlay: "#162130",
      border: "#1e3448",
      accent: "#00b4d8",
      text: "#e8f4f8",
      textDim: "#2e5470",
    },
    green: {
      bg: "#0d1210",
      raised: "#121a15",
      overlay: "#182318",
      border: "#1e3325",
      accent: "#4ade80",
      text: "#ecfdf0",
      textDim: "#2d5438",
    },
    light: {
      bg: "#f0f7fa",
      raised: "#ffffff",
      overlay: "#e1f0f5",
      border: "#b8dde8",
      accent: "#0077a8",
      text: "#0a1f2e",
      textDim: "#7aadbe",
    },
    orange: {
      bg: "#110e09",
      raised: "#1a1410",
      overlay: "#231b12",
      border: "#3d2e1a",
      accent: "#fb923c",
      text: "#fef3e8",
      textDim: "#4a3520",
    },
    red: {
      bg: "#110a0a",
      raised: "#1a0f0f",
      overlay: "#231414",
      border: "#3d1a1a",
      accent: "#f87171",
      text: "#fff1f1",
      textDim: "#4a2020",
    },
  };

  const labels = {
    dark: "Dark",
    navy: "Navy",
    green: "Green",
    light: "Light",
    orange: "Orange",
    red: "Red",
  };

  const p = palettes[theme];

  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-start",
      }}
    >
      {/* Preview window */}
      <div
        style={{
          width: "180px",
          height: "120px",
          borderRadius: "8px",
          border: isSelected
            ? `2px solid ${p.accent}`
            : "2px solid var(--border)",
          background: p.bg,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "border-color 0.15s ease",
          boxShadow: isSelected ? `0 0 0 3px ${p.accent}22` : "none",
        }}
      >
        {/* Fake titlebar */}
        <div
          style={{
            height: "16px",
            background: p.bg,
            borderBottom: `1px solid ${p.border}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: "6px",
            gap: "3px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: p.accent,
              opacity: 0.8,
            }}
          />
          <div
            style={{
              width: "20px",
              height: "3px",
              borderRadius: "2px",
              background: p.textDim,
              marginLeft: "4px",
            }}
          />
        </div>

        {/* Fake body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Fake sidebar */}
          <div
            style={{
              width: "20px",
              background: p.bg,
              borderRight: `1px solid ${p.border}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "6px",
              gap: "5px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                background: p.accent,
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                background: p.textDim,
                opacity: 0.4,
              }}
            />
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                background: p.textDim,
                opacity: 0.4,
              }}
            />
          </div>

          {/* Fake content */}
          <div
            style={{
              flex: 1,
              background: p.raised,
              padding: "5px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {/* Fake image grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "3px",
              }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "16px",
                    borderRadius: "2px",
                    background: i === 0 ? p.accent + "44" : p.overlay,
                    border: `1px solid ${p.border}`,
                  }}
                />
              ))}
            </div>
            {/* Fake text lines */}
            <div
              style={{
                height: "3px",
                borderRadius: "2px",
                background: p.textDim,
                opacity: 0.4,
                width: "70%",
              }}
            />
            <div
              style={{
                height: "3px",
                borderRadius: "2px",
                background: p.textDim,
                opacity: 0.25,
                width: "50%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            border: isSelected
              ? `2px solid ${p.accent}`
              : "2px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isSelected && (
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: p.accent,
              }}
            />
          )}
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "12px",
            color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: isSelected ? 600 : 400,
          }}
        >
          {labels[theme]}
        </span>
      </div>
    </button>
  );
}
