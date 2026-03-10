import { useState, useEffect } from "react";
import { extractUrlsFromText } from "../utils/extractUrlsFromText";
import { stripUrls } from "../utils/stripUrls";

function PinIcon({ filled, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ReprocessIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export function UserTagsEditor({ screenshot, onTagsUpdated }) {
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setTags(
      screenshot?.user_tags
        ? screenshot.user_tags.split(",").map((t) => t.trim()).filter(Boolean)
        : []
    );
    setInput("");
  }, [screenshot?.filepath]);

  function addTag() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) { setInput(""); return; }
    const newTags = [...tags, trimmed];
    setTags(newTags);
    setInput("");
    const joined = newTags.join(", ");
    window.shard.updateUserTags(screenshot.filepath, joined);
    onTagsUpdated?.(joined);
  }

  function removeTag(tag) {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    const joined = newTags.join(", ");
    window.shard.updateUserTags(screenshot.filepath, joined);
    onTagsUpdated?.(joined);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && input === "" && tags.length > 0) removeTag(tags[tags.length - 1]);
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "6px", letterSpacing: "0.05em" }}>
        YOUR TAGS
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
        {tags.map((tag) => (
          <span key={tag} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-primary)", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: "4px", padding: "2px 6px", display: "flex", alignItems: "center", gap: "4px" }}>
            {tag}
            <button onClick={() => removeTag(tag)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "10px", padding: 0, lineHeight: 1 }}>✕</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: "4px", padding: "3px 6px" }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Add tag..." style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-primary)", minWidth: 0 }} />
        <button onClick={addTag} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "14px", padding: 0, lineHeight: 1 }}>+</button>
      </div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "4px" }}>Press Enter or , to add</p>
    </div>
  );
}

export function ScreenshotModal({ screenshot, onClose, onTagsUpdated, onPinToggled }) {
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [copiedText, setCopiedText] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [pinned, setPinned] = useState(!!screenshot?.pinned);
  const [localOcrText, setLocalOcrText] = useState(screenshot?.ocr_text || "");
  const [localOcrStatus, setLocalOcrStatus] = useState(screenshot?.ocr_status || "pending");
  const [localTags, setLocalTags] = useState(screenshot?.ai_tags || "");
const [reprocessCount, setReprocessCount] = useState(0)
  // Escape key
  useEffect(() => {
    if (!screenshot) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screenshot, onClose]);

  // Sync local state when screenshot changes
  useEffect(() => {
  setPinned(!!screenshot?.pinned)
  setLocalOcrText(screenshot?.ocr_text || "")
  setLocalOcrStatus(screenshot?.ocr_status || "pending")
  setLocalTags(screenshot?.ai_tags || "")
  setReprocessing(false)
  setReprocessCount(0)
}, [screenshot?.filepath, screenshot?.pinned])


  // Live update listeners — properly cleaned up to avoid stacking
useEffect(() => {
  if (!screenshot) return

  function handleOcr({ filepath, ocrText }) {
    if (filepath !== screenshot.filepath) return
    setLocalOcrText(ocrText)
    setLocalOcrStatus("done")
  }

  function handleTagged({ filepath, aiTags }) {
    if (filepath !== screenshot.filepath) return
    setLocalTags(aiTags)
    setReprocessing(false)
  }

  window.shard.onScreenshotOcrDone(handleOcr)
  window.shard.onScreenshotTagged(handleTagged)

  return () => {
    window.shard.removeListener("screenshot:ocr-done", handleOcr)
    window.shard.removeListener("screenshot:tagged", handleTagged)
  }
}, [screenshot?.filepath, reprocessCount])

  if (!screenshot) return null;

  const urls = extractUrlsFromText(localOcrText);

  function handleCopyText() {
    if (!localOcrText) return;
    window.shard.copyToClipboard(localOcrText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }

async function handleReprocess() {
  setReprocessing(true)
  setLocalOcrText("")
  setLocalOcrStatus("pending")
  setLocalTags("")
  setReprocessCount(c => c + 1)
  await window.shard.reprocessScreenshot(screenshot.filepath)
}
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", width: "820px", maxWidth: "92vw", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Image */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={`file://${screenshot.filepath}`} alt={screenshot.filename} style={{ width: "100%", maxHeight: "400px", objectFit: "contain", background: "#000", display: "block" }} />
          <button onClick={onClose} style={{ position: "absolute", top: "10px", right: "10px", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>✕</button>
        </div>

        {/* Meta — two columns */}
        <div style={{ borderTop: "1px solid var(--border)", display: "flex", overflow: "hidden", flex: 1, minHeight: 0 }}>

          {/* Left column */}
          <div style={{ width: "220px", flexShrink: 0, borderRight: "1px solid var(--border)", padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "0.05em" }}>FILENAME</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", wordBreak: "break-all", lineHeight: "1.5" }}>{screenshot.filename}</p>
            </div>

            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px", letterSpacing: "0.05em" }}>DATE</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{new Date(screenshot.timestamp).toLocaleString()}</p>
            </div>

            {/* Pin */}
            <button
              onClick={async () => {
                const newVal = await window.shard.togglePin(screenshot.filepath);
                setPinned(!!newVal);
                onPinToggled?.(screenshot.filepath, !!newVal);
              }}
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: pinned ? "var(--accent)" : "var(--text-dim)", background: pinned ? "var(--accent-glow)" : "transparent", border: "1px solid", borderColor: pinned ? "var(--accent-dim)" : "var(--border)", borderRadius: "6px", padding: "7px 12px", cursor: "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              onMouseEnter={(e) => { if (!pinned) e.currentTarget.style.background = "var(--bg-overlay)"; }}
              onMouseLeave={(e) => { if (!pinned) e.currentTarget.style.background = "transparent"; }}
            >
              <PinIcon filled={pinned} size={11} />
              {pinned ? "Pinned" : "Pin Screenshot"}
            </button>

            {/* Reprocess */}
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: reprocessing ? "var(--text-dim)" : "var(--text-secondary)", background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", padding: "7px 12px", cursor: reprocessing ? "not-allowed" : "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              onMouseEnter={(e) => { if (!reprocessing) e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <ReprocessIcon />
              {reprocessing ? "Reprocessing..." : "Reprocess"}
            </button>

            {/* AI Tags */}
            {localTags && (
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "6px", letterSpacing: "0.05em" }}>TAGS</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {localTags.split(",").filter(Boolean).map((tag) => (
                    <span key={tag} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--accent)", background: "var(--accent-glow)", border: "1px solid var(--accent-dim)", borderRadius: "4px", padding: "2px 6px" }}>{tag.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* User Tags */}
            <UserTagsEditor screenshot={screenshot} onTagsUpdated={(newTags) => onTagsUpdated?.(screenshot.filepath, newTags)} />

            {/* URLs */}
            {urls.length > 0 && (
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "6px", letterSpacing: "0.05em" }}>URLS FOUND</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {urls.map((url) => (
                    <button key={url} onClick={() => { window.shard.copyToClipboard(url); setCopiedUrl(url); setTimeout(() => setCopiedUrl(null), 2000); }} title={url}
                      style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: copiedUrl === url ? "var(--bg)" : "var(--accent)", background: copiedUrl === url ? "var(--accent)" : "var(--accent-glow)", border: "1px solid var(--accent-dim)", borderRadius: "4px", padding: "5px 8px", cursor: "pointer", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", transition: "all 0.15s ease" }}>
                      {copiedUrl === url ? "✓ Copied" : url}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Delete */}
            <button
              onClick={async () => { setDeleting(true); await window.shard.deleteScreenshot(screenshot.filepath); onClose(); }}
              disabled={deleting}
              style={{ marginTop: "auto", fontFamily: "var(--font-mono)", fontSize: "11px", color: deleting ? "var(--text-dim)" : "#f87171", background: "transparent", border: "1px solid", borderColor: deleting ? "var(--border)" : "#f8717144", borderRadius: "6px", padding: "7px 12px", cursor: deleting ? "not-allowed" : "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "#f8717122"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <TrashIcon />
              {deleting ? "Deleting..." : "Delete Screenshot"}
            </button>
          </div>

          {/* Right column — OCR text */}
          <div style={{ flex: 1, minWidth: 0, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.05em" }}>EXTRACTED TEXT</p>
              {localOcrText && !reprocessing && (
                <button
                  onClick={handleCopyText}
                  style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-mono)", fontSize: "10px", color: copiedText ? "var(--accent)" : "var(--text-dim)", background: copiedText ? "var(--accent-glow)" : "transparent", border: "1px solid", borderColor: copiedText ? "var(--accent-dim)" : "var(--border)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={(e) => { if (!copiedText) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}}
                  onMouseLeave={(e) => { if (!copiedText) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}}
                >
                  {copiedText ? <CheckIcon /> : <CopyIcon />}
                  {copiedText ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {reprocessing ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)" }}>Reprocessing...</p>
              </div>
            ) : localOcrText ? (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.8", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {stripUrls(localOcrText)}
              </p>
            ) : (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-dim)" }}>
                {localOcrStatus === "pending" ? "Processing..." : "No text found"}
              </p>
            )}
          </div>
        </div>

        {/* Keyboard hint bar */}
        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-dim)" }}>← → to navigate · Esc to close</span>
        </div>
      </div>
    </div>
  );
}