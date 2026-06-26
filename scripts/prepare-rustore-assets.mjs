/**
 * Графика для RuStore Console.
 *
 *   npm run rustore:assets
 *
 * artifacts/rustore/store/
 *   icon-512.png   — полный логотип (как в APK)
 *   screenshot-*.jpg — 1920×1080, 16:9
 */
import { statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncAppIcon } from './sync-app-icon.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'artifacts', 'rustore', 'store');

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    console.error('Установите sharp: npm install sharp --no-save');
    process.exit(1);
  }
}

async function writeScreenshots(sharp) {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.warn('playwright не установлен — скриншоты пропущены.');
    return [];
  }

  const { chromium } = playwright;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    console.warn('Chromium для Playwright не установлен — скриншоты пропущены.');
    console.warn('Выполните: npx playwright install chromium');
    if (error instanceof Error) {
      console.warn(error.message);
    }
    return [];
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: 'ru-RU',
  });
  const page = await context.newPage();

  const shots = [
    { name: '01-home', url: 'https://nagaevomaster.ru/' },
    { name: '02-listings', url: 'https://nagaevomaster.ru/services' },
    { name: '03-forum', url: 'https://nagaevomaster.ru/forum' },
    { name: '04-auth', url: 'https://nagaevomaster.ru/auth?tab=register' },
    { name: '05-app', url: 'https://nagaevomaster.ru/app' },
  ];

  const written = [];

  for (const shot of shots) {
    try {
      await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
      const filePath = path.join(outDir, `screenshot-${shot.name}.jpg`);
      const buffer = await page.screenshot({ type: 'jpeg', quality: 88, fullPage: false });
      const optimized = await sharp(buffer)
        .resize(1920, 1080, { fit: 'cover', position: 'top' })
        .jpeg({ quality: 86, mozjpeg: true })
        .toBuffer();
      writeFileSync(filePath, optimized);
      written.push({
        path: filePath,
        sizeKb: Math.round(optimized.length / 1024),
      });
      console.log(`screenshot: ${path.basename(filePath)} (${Math.round(optimized.length / 1024)} KB)`);
    } catch (error) {
      console.warn(`Не удалось: ${shot.url}`, error instanceof Error ? error.message : error);
    }
  }

  await browser.close();
  return written;
}

const icon = await syncAppIcon();
const sharp = await loadSharp();
const screenshots = await writeScreenshots(sharp);

console.log(`
RuStore → artifacts/rustore/store/
  Иконка: icon-512.png (${Math.round(icon.sizeKb)} KB, полный логотип)
  Скриншоты: ${screenshots.length} шт.
`);
