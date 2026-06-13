import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourceDir = path.join('C:', 'Users', 'Admin', 'Desktop', 'Новая папка');
const customDir = path.join(root, 'src', 'assets', 'listing-photos');
const outDir = path.join(root, 'public', 'listings');

/** Целевое имя в public/listings → файл из папки пользователя */
const IMAGE_MAP = {
  'agri-machinery-1.png': ['folder', 'tractor.png'],
  'agri-machinery-2.jpg': ['folder', 'cpaska.jpg'],
  'machinery-1.png': ['folder', 'tractor.png'],
  'earthmoving-1.jpg': ['folder', 'ecxpvator.jpg'],
  'earthmoving-2.jpg': ['folder', 'ecxpvator.jpg'],
  'roofers-1.jpg': ['folder', 'crovlya.jpg'],
  'roofers-2.jpg': ['folder', 'crovlya.jpg'],
  'septic-service-1.jpg': ['folder', 'acinizator.jpg'],
  'septic-install-1.jpg': ['folder', 'ceptik.jpg'],
  'plumbers-1.jpg': ['custom', 'plumbers.jpg'],
  'plumbers-2.jpg': ['custom', 'plumbers.jpg'],
  'water-1.png': ['folder', 'burenie vodi.png'],
  'utility-1.png': ['folder', 'burenie vodi.png'],
  'cleaners-1.jpg': ['folder', 'uborka.jpg'],
  'country-move-1.jpg': ['folder', 'pereezd.jpg'],
  'plowing-1.jpg': ['folder', 'cpaska.jpg'],
  'lawyers-1.jpg': ['folder', 'urist.jpg'],
  'firewood-sales-1.jpg': ['folder', 'drova.jpg'],
  'nails-1.jpg': ['folder', 'maniqur.jpg'],
  'nails-2.jpg': ['folder', 'maniqur.jpg'],
  'barber-1.jpg': ['folder', 'barber.jpg'],
  'barber-2.jpg': ['folder', 'barber.jpg'],
  'hairdresser-1.jpg': ['folder', 'barber.jpg'],
  'hairdresser-2.jpg': ['folder', 'barber.jpg'],
  'waste-1.jpg': ['folder', 'vivoz musora.jpg'],
  'gardeners-1.jpg': ['folder', 'sad.jpg'],
  'glazing-1.jpg': ['folder', 'osteclenie.jpg'],
  'evacuator-1.jpg': ['folder', 'evokuator.jpg'],
  'tutors-1.jpg': ['folder', 'repetitor.jpg'],
  'mowing-1.jpg': ['folder', 'pocos.jpg'],
  'mowing-2.jpg': ['folder', 'pocos.jpg'],
  'bulk-materials-1.webp': ['folder', 'materiali.webp'],
  'builders-1.jpg': ['folder', 'stroitel.jpg'],
  'builders-2.jpg': ['folder', 'stroitel.jpg'],
  'construction-1.jpg': ['folder', 'stroitel.jpg'],
  'construction-2.jpg': ['folder', 'stroitel.jpg'],
  'photographers-1.jpg': ['folder', 'photograf.jpg'],
  'beauty-1.jpg': ['folder', 'maniqur.jpg'],
  'beauty-2.jpg': ['folder', 'barber.jpg'],
  'farming-1.png': ['folder', 'tractor.png'],
  'farming-2.jpg': ['folder', 'pocos.jpg'],
  'electricians-1.jpg': ['custom', 'electricians.jpg'],
  'electricians-2.jpg': ['custom', 'electricians.jpg'],
  'default-1.jpg': ['folder', 'stroitel.jpg'],
  'default-2.png': ['folder', 'tractor.png'],
};

await mkdir(outDir, { recursive: true });

let ok = 0;

for (const [target, [kind, source]] of Object.entries(IMAGE_MAP)) {
  const from = path.join(kind === 'custom' ? customDir : sourceDir, source);
  const to = path.join(outDir, target);
  await copyFile(from, to);
  ok += 1;
  console.log(`OK  ${target} ← ${source}`);
}

console.log(`\n${ok} photos → ${outDir}`);
