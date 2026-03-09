export function cleanOcrUrl(url) {
  return url
    .replace(/\s+/g, "")
    .replace(/[""'']/g, "")
    .replace(/\\+/g, "/");
}
