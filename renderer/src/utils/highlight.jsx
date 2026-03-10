export function highlight(text, query) {
  if (!text || !query) return text || ""
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const parts = text.split(new RegExp(`(${escaped})`, "gi"))
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
      )
    )
  } catch {
    return text
  }
}