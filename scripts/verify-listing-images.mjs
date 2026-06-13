import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const listingsDir = path.join(__dirname, '..', 'public', 'listings');

/** Stems that ship as PNG only (no JPG duplicate). */
const PNG_ONLY_STEMS = new Set([
  'agri-machinery-1',
  'machinery-1',
  'farming-1',
  'utility-1',
  'water-1',
  'default-2',
  'bulk-materials-1',
]);

const REQUIRED_STEMS = [
  'electricians-1', 'electricians-2',
  'agri-machinery-1', 'agri-machinery-2',
  'earthmoving-1', 'earthmoving-2',
  'hairdresser-1', 'hairdresser-2',
  'barber-1', 'barber-2',
  'nails-1', 'nails-2',
  'roofers-1', 'roofers-2',
  'plumbers-1', 'plumbers-2',
  'septic-service-1',
  'mowing-1', 'mowing-2',
  'cleaners-1',
  'country-move-1',
  'plowing-1',
  'lawyers-1',
  'firewood-sales-1',
  'water-1',
  'waste-1',
  'gardeners-1',
  'glazing-1',
  'evacuator-1',
  'septic-install-1',
  'tutors-1',
  'bulk-materials-1',
  'builders-1', 'builders-2',
  'photographers-1',
  'construction-1', 'construction-2',
  'machinery-1',
  'utility-1',
  'beauty-1', 'beauty-2',
  'farming-1', 'farming-2',
  'default-1', 'default-2',
];

const files = new Set(await readdir(listingsDir));
const missing = [];

for (const stem of REQUIRED_STEMS) {
  const preferred = PNG_ONLY_STEMS.has(stem) ? 'png' : 'jpg';
  const hasPreferred = files.has(`${stem}.${preferred}`);
  const hasSvg = files.has(`${stem}.svg`);
  const hasJpg = files.has(`${stem}.jpg`);
  const hasPng = files.has(`${stem}.png`);

  if (!hasPreferred && !hasJpg && !hasPng) {
    missing.push(`${stem} (no raster)`);
    continue;
  }

  if (!hasSvg) {
    missing.push(`${stem}.svg (fallback)`);
  }
}

if (missing.length > 0) {
  console.error('Missing listing images:\n' + missing.map((item) => `  - ${item}`).join('\n'));
  process.exit(1);
}

console.log(`OK: ${REQUIRED_STEMS.length} listing image stems verified.`);
