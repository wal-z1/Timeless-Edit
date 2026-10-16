import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root, 'data/lyrics.raw.txt'), 'utf8');
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

const lines = source.split(/\r?\n/);
const sections = [];
let current = null;
const ensureIntro = () => current || (current = { label: 'Intro', performers: '', lines: [] }, sections.push(current));
for (const raw of lines) {
  let line = raw.trim();
  if (!line || line === 'You might also like' || /^\d+Embed$/.test(line) || /^\[[^\]]+\]\([^)]*-lyrics\)$/.test(line)) continue;
  line = line.replace(/^\[\[([^\]]+)\]\]\([^)]*\)$/, '[$1]').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  line = normalize(line);
  if (!line) continue;
  const header = line.match(/^\[([^\]]+)\]$/);
  if (header) {
    const [label, ...performer] = header[1].split(':');
    current = { label: label.trim(), performers: performer.join(':').trim(), lines: [] };
    sections.push(current);
  } else {
    ensureIntro().lines.push({ text: line, time: null });
  }
}
const output = { title: 'Timeless', artist: 'The Weeknd', sections };
await writeFile(resolve(root, 'data/lyrics.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Parsed ${sections.length} sections: ${sections.map(({ label, lines: entries }) => `${label} (${entries.length})`).join(', ')}`);
if (/genius\.com|\]\(/.test(JSON.stringify(output))) console.warn('Warning: leftover markup detected.');
