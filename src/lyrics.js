import lyricsData from '../data/lyrics.json';

export async function loadLyrics() {
  return lyricsData;
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
