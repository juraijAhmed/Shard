import { useState } from "react";
import { extractUrlsFromText } from "../utils/extractUrlsFromText";
import { stripUrls } from "../utils/stripUrls";
import { cleanOcrUrl } from '../utils/cleanOcrUrl'
export function ScreenshotModal({ screenshot, onClose }) {
  const [copiedUrl, setCopiedUrl] = useState(null);
  if (!screenshot) return null;

  const urls = extractUrlsFromText(screenshot.ocr_text);

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
          width: "820px",
          maxWidth: "92vw",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={`file://${screenshot.filepath}`}
            alt={screenshot.filename}
            style={{
              width: "100%",
              maxHeight: "400px",
              objectFit: "contain",
              background: "#000",
              display: "block",
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

        {/* Meta — two columns */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            display: "flex",
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Left column — metadata, tags, URLs */}
          <div
            style={{
              width: "220px",
              flexShrink: 0,
              borderRight: "1px solid var(--border)",
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Filename */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  marginBottom: "4px",
                  letterSpacing: "0.05em",
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
                  lineHeight: "1.5",
                }}
              >
                {screenshot.filename}
              </p>
            </div>

            {/* Date */}
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-dim)",
                  marginBottom: "4px",
                  letterSpacing: "0.05em",
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

            {/* Tags */}
            {screenshot.ai_tags && (
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-dim)",
                    marginBottom: "6px",
                    letterSpacing: "0.05em",
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
                        background: "var(--accent-glow)",
                        border: "1px solid var(--accent-dim)",
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

            {/* URLs */}
            {urls.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-dim)",
                    marginBottom: "6px",
                    letterSpacing: "0.05em",
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
                      title={url}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color:
                          copiedUrl === url ? "var(--bg)" : "var(--accent)",
                        background:
                          copiedUrl === url
                            ? "var(--accent)"
                            : "var(--accent-glow)",
                        border: "1px solid var(--accent-dim)",
                        borderRadius: "4px",
                        padding: "5px 8px",
                        cursor: "pointer",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {copiedUrl === url ? "✓ Copied" : url}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — OCR text only */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: "16px",
              overflowY: "auto",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-dim)",
                marginBottom: "8px",
                letterSpacing: "0.05em",
              }}
            >
              EXTRACTED TEXT
            </p>
            {screenshot.ocr_text ? (
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.8",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {stripUrls(screenshot.ocr_text)}
              </p>
            ) : (
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-dim)",
                }}
              >
                {screenshot.ocr_status === "pending"
                  ? "Processing..."
                  : "No text found"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
