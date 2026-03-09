import { cleanOcrUrl } from './cleanOcrUrl'

export function extractUrlsFromText(text) {
  if (!text) return []

  // Match full URLs with protocol
  const withProtocol = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g

  // Match bare domains — allow any non-space characters before the domain
  const bareUrl = /(?:^|[\s"'(])(((?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|app|co|uk|gov|edu|me|gg|ai))(?:\/[-a-zA-Z0-9()@:%_+.~#?&/=]*)?)/gm

  const found = new Set()

  const full = text.match(withProtocol) || []
  full.forEach((u) => found.add(u))

  let match
  while ((match = bareUrl.exec(text)) !== null) {
    const cleaned = cleanOcrUrl(match[1])
    const alreadyCovered = [...found].some((f) => f.includes(cleaned))
    if (!alreadyCovered) found.add(`https://${cleaned}`)
  }

  return [...found]
}