function extractUrls(text) {
  if (!text) return []

  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g
  const matches = text.match(urlRegex) || []

  // Deduplicate
  return [...new Set(matches)]
}

module.exports = { extractUrls }