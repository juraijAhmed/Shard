export function stripUrls(text) {
  if (!text) return "";
  return text
    .replace(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g,
      "",
    )
    .replace(
      /\b((?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|app|co|uk|gov|edu|me|gg)(?:\/[-a-zA-Z0-9()@:%_+.~#?&/=]*)?)/g,
      "",
    )
    .replace(/\n{3,}/g, "\n\n") // collapse extra blank lines left behind
    .trim();
}
