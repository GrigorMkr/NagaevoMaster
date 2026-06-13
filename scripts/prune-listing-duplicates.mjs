import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const listingsDir = path.join(__dirname, '..', 'public', 'listings');

const PNG_ONLY_STEMS = new Set([
  'agri-machinery-1',
  'machinery-1',
  'farming-1',
  'utility-1',
  'water-1',
  'default-2',
  'bulk-materials-1',
]);

const files = await readdir(listingsDir);
const byStem = new Map();

for (const file of files) {
  const match = file.match(/^(.+)-(\d+)\.(\w+)$/);
  if (!match) continue;
  const [, stem, variant, ext] = match;
  const key = `${stem}-${variant}`;
  if (!byStem.has(key)) byStem.set(key, new Set());
  byStem.get(key).add(ext);
}

let removed = 0;

for (const [key, extensions] of byStem) {
  const hasJpg = extensions.has('jpg');
  const hasPng = extensions.has('png');
  const hasWebp = extensions.has('webp');

  if (hasJpg && hasPng && !PNG_ONLY_STEMS.has(key)) {
    await unlink(path.join(listingsDir, `${key}.png`));
    removed += 1;
    console.log(`removed ${key}.png (jpg kept)`);
  }

  if ((hasJpg || hasPng) && hasWebp) {
    await unlink(path.join(listingsDir, `${key}.webp`));
    removed += 1;
    console.log(`removed ${key}.webp`);
  }
}

console.log(`\nRemoved ${removed} duplicate raster files. SVG fallbacks kept.`);
