import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'listings');

/** Unsplash — прямые ссылки на фото услуг и техники */
const IMAGES = {
  'electricians-1.png': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80&fm=jpg',
  'electricians-2.png': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80&fm=jpg',
  'agri-machinery-1.png': 'https://images.unsplash.com/photo-1592982537447-7447730cbfc9?w=800&q=80&fm=jpg',
  'agri-machinery-2.png': 'https://images.unsplash.com/photo-1625246333195-78d9c090a9f?w=800&q=80&fm=jpg',
  'roofers-1.png': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&fm=jpg',
  'roofers-2.png': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80&fm=jpg',
  'septic-service-1.png': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80&fm=jpg',
  'earthmoving-1.png': 'https://images.unsplash.com/photo-1581094271901-8562e8893c84?w=800&q=80&fm=jpg',
  'earthmoving-2.png': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fm=jpg',
  'plumbers-1.png': 'https://images.unsplash.com/photo-1585704032915-e97e7e4c8d3f?w=800&q=80&fm=jpg',
  'plumbers-2.png': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80&fm=jpg',
  'cleaners-1.png': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&fm=jpg',
  'country-move-1.png': 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&fm=jpg',
  'plowing-1.png': 'https://images.unsplash.com/photo-1416879595882-3373a0488b85?w=800&q=80&fm=jpg',
  'lawyers-1.png': 'https://images.unsplash.com/photo-1589829545855-d48d945039ae?w=800&q=80&fm=jpg',
  'firewood-sales-1.png': 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&q=80&fm=jpg',
  'nails-1.png': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&fm=jpg',
  'nails-2.png': 'https://images.unsplash.com/photo-1519014815651-f97ebdad25a5?w=800&q=80&fm=jpg',
  'water-1.png': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80&fm=jpg',
  'barber-1.png': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80&fm=jpg',
  'barber-2.png': 'https://images.unsplash.com/photo-1622286342628-4aa456b00052?w=800&q=80&fm=jpg',
  'waste-1.png': 'https://images.unsplash.com/photo-1530587194095-5bb581fd2f61?w=800&q=80&fm=jpg',
  'gardeners-1.png': 'https://images.unsplash.com/photo-1416879595882-3373a0488b85?w=800&q=80&fm=jpg',
  'glazing-1.png': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&fm=jpg',
  'evacuator-1.png': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80&fm=jpg',
  'septic-install-1.png': 'https://images.unsplash.com/photo-1585704032915-e97e7e4c8d3f?w=800&q=80&fm=jpg',
  'tutors-1.png': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&fm=jpg',
  'mowing-1.png': 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80&fm=jpg',
  'mowing-2.png': 'https://images.unsplash.com/photo-1416879595882-3373a0488b85?w=800&q=80&fm=jpg',
  'bulk-materials-1.png': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fm=jpg',
  'builders-1.png': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80&fm=jpg',
  'builders-2.png': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&fm=jpg',
  'photographers-1.png': 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80&fm=jpg',
  'construction-1.png': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&fm=jpg',
  'construction-2.png': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80&fm=jpg',
  'machinery-1.png': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80&fm=jpg',
  'utility-1.png': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&fm=jpg',
  'beauty-1.png': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&fm=jpg',
  'beauty-2.png': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&fm=jpg',
  'farming-1.png': 'https://images.unsplash.com/photo-1625246333195-78d9c090a9f?w=800&q=80&fm=jpg',
  'farming-2.png': 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80&fm=jpg',
  'default-1.png': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80&fm=jpg',
  'default-2.png': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&fm=jpg',
  'hairdresser-1.png': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&fm=jpg',
  'hairdresser-2.png': 'https://images.unsplash.com/photo-1492106087820-71f1a00d2d11?w=800&q=80&fm=jpg',
};

await mkdir(outDir, { recursive: true });

let ok = 0;
let failed = 0;

for (const [filename, url] of Object.entries(IMAGES)) {
  const target = path.join(outDir, filename);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NagaevoMaster/1.0)' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1000) {
      throw new Error('file too small');
    }
    await writeFile(target, buffer);
    ok += 1;
    console.log(`OK  ${filename}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${filename}: ${error.message}`);
  }
}

console.log(`\nDone: ${ok} saved, ${failed} failed → ${outDir}`);

if (failed > 0) {
  console.log('Fallback: npm run images:listings (local village photos)');
  process.exitCode = 1;
}
