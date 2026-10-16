export async function loadLyrics() {
  const response = await fetch('/data/lyrics.json');
  if (!response.ok) throw new Error(`Lyrics failed to load (${response.status})`);
  return response.json();
}

export function formatLine(text) {
  const parts = [];
  let cursor = 0;
  const pattern = /\([^)]*\)/g;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), adlib: false });
    parts.push({ text: match[0], adlib: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), adlib: false });
  return parts;
}
