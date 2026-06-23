import twemoji from '@twemoji/api';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TWEMOJI_VERSION = '17.0.2';
const TWEMOJI_CDN = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/svg`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'src/data/reactionIcons.ts');
const OUT_DIR = path.join(ROOT, 'public/emoji');

function extractEmojis(source) {
  const fromReactions = [...source.matchAll(/reaction\(\s*'[^']+'\s*,\s*'([^']+)'/g)].map((match) => match[1]);
  const fromTabs = [...source.matchAll(/tabEmoji:\s*'([^']+)'/g)].map((match) => match[1]);
  return [...new Set([...fromReactions, ...fromTabs])];
}

function emojiCodepoint(emoji) {
  return twemoji.convert.toCodePoint(emoji);
}

function emojiCodepointCandidates(emoji) {
  const primary = emojiCodepoint(emoji);
  const stripped = primary.replace(/-fe0f/g, '');
  return stripped === primary ? [primary] : [stripped, primary];
}

async function downloadEmoji(emoji) {
  let lastStatus = 0;

  for (const codepoint of emojiCodepointCandidates(emoji)) {
    const url = `${TWEMOJI_CDN}/${codepoint}.svg`;
    const response = await fetch(url);

    if (response.ok) {
      const svg = await response.text();
      fs.writeFileSync(path.join(OUT_DIR, `${codepoint}.svg`), svg, 'utf8');
      return codepoint;
    }

    lastStatus = response.status;
  }

  throw new Error(`Failed ${emoji}: ${lastStatus}`);
}

async function main() {
  const source = fs.readFileSync(SOURCE_FILE, 'utf8');
  const emojis = extractEmojis(source);

  if (emojis.length === 0) {
    throw new Error('No emojis found in reactionIcons.ts');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  for (const emoji of emojis) {
    const codepoint = await downloadEmoji(emoji);
    ok += 1;
    console.log(`✓ ${emoji} -> ${codepoint}.svg`);
  }

  console.log(`Downloaded ${ok} Twemoji SVG files to public/emoji/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
