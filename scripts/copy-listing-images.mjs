import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourceDir = path.join(root, 'src', 'assets', 'landscapes');
const outDir = path.join(root, 'public', 'listings');

const SOURCES = [
  'nagaevo-aerial.png',
  'nagaevo-church.png',
  'nagaevo-houses.png',
  'nagaevo-mosque.png',
  'nagaevo-river.png',
  'nagaevo-street.png',
];

/** Имена файлов для карточек объявлений → индекс фото посёлка */
const TARGETS = {
  'electricians-1.png': 4,
  'electricians-2.png': 2,
  'agri-machinery-1.png': 0,
  'agri-machinery-2.png': 2,
  'roofers-1.png': 2,
  'roofers-2.png': 5,
  'septic-service-1.png': 4,
  'earthmoving-1.png': 0,
  'earthmoving-2.png': 5,
  'plumbers-1.png': 4,
  'plumbers-2.png': 2,
  'cleaners-1.png': 2,
  'country-move-1.png': 5,
  'plowing-1.png': 0,
  'lawyers-1.png': 1,
  'firewood-sales-1.png': 0,
  'nails-1.png': 3,
  'nails-2.png': 5,
  'water-1.png': 4,
  'barber-1.png': 5,
  'barber-2.png': 3,
  'waste-1.png': 5,
  'gardeners-1.png': 0,
  'glazing-1.png': 2,
  'evacuator-1.png': 5,
  'septic-install-1.png': 4,
  'tutors-1.png': 1,
  'mowing-1.png': 0,
  'mowing-2.png': 2,
  'bulk-materials-1.png': 5,
  'builders-1.png': 2,
  'builders-2.png': 5,
  'photographers-1.png': 1,
  'construction-1.png': 2,
  'construction-2.png': 5,
  'machinery-1.png': 0,
  'utility-1.png': 4,
  'beauty-1.png': 3,
  'beauty-2.png': 5,
  'farming-1.png': 0,
  'farming-2.png': 2,
  'default-1.png': 1,
  'default-2.png': 2,
  'hairdresser-1.png': 3,
  'hairdresser-2.png': 5,
};

await mkdir(outDir, { recursive: true });

for (const [target, sourceIndex] of Object.entries(TARGETS)) {
  const source = path.join(sourceDir, SOURCES[sourceIndex]);
  const dest = path.join(outDir, target);
  await copyFile(source, dest);
  console.log(`OK  ${target} ← ${SOURCES[sourceIndex]}`);
}

console.log(`\n${Object.keys(TARGETS).length} images → ${outDir}`);
