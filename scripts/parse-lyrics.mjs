import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const title = process.env.LYRICS_TITLE || 'Timeless';
const artist = process.env.LYRICS_ARTIST || 'The Weeknd';
const platform = process.env.LYRICS_PLATFORM || 'youtube';
const endpoint = new URL(`https://lyrics.lewdhutao.my.eu.org/v2/${platform}/lyrics`);
endpoint.searchParams.set('title', title);
endpoint.searchParams.set('artist', artist);

let source;
try {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Lyrics API request failed (${response.status} ${response.statusText})`);
  }

  const payload = await response.json();
  source = payload?.data?.lyrics;
  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('Lyrics API response did not contain data.lyrics');
  }
} catch (error) {
  console.warn(`Lyrics API refresh skipped: ${error.message}`);
  console.warn('Keeping the committed data/lyrics.json so the deployment can continue.');
  process.exit(0);
}

const lookalikes = new Map(Object.entries({
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', і: 'i', ј: 'j',
  А: 'A', Е: 'E', О: 'O', Р: 'P', С: 'C', Х: 'X', І: 'I', Ј: 'J'
}));
const normalize = (value) => value
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/\u00A0/g, ' ')
  .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  .replace(/[а-ео-рс-хіјА-ЕО-РС-ХІЈ]/g, (char) => lookalikes.get(char) || char)
  .replace(/\s+/g, ' ').trim();

const sections = source.split(/\r?\n\s*\r?\n/).map((paragraph, index) => ({
  label: index === 0 ? 'Intro' : `Section ${index}`,
  performers: artist,
  lines: paragraph.split(/\r?\n/)
    .map((line) => normalize(line))
    .filter(Boolean)
    .map((text) => ({ text, time: null }))
})).filter(({ lines }) => lines.length > 0);
const output = { title, artist, sections };
await writeFile(resolve(root, 'data/lyrics.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Parsed ${sections.length} sections: ${sections.map(({ label, lines: entries }) => `${label} (${entries.length})`).join(', ')}`);
