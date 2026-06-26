/**
 * Единая иконка приложения: полный логотип из public/favicon.svg
 * → Android mipmap + public/icon-512.png + RuStore store icon.
 *
 *   npm run android:icons
 */
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = path.join(root, 'public', 'favicon.svg');
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
const background = '#081f18';

const LAUNCHER_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    console.error('Установите sharp: npm install sharp --no-save');
    process.exit(1);
  }
}

async function renderLogoPng(sharp, size) {
  try {
    return await renderLogoWithPlaywright(size);
  } catch (playwrightError) {
    console.warn('Playwright недоступен, fallback на sharp:', playwrightError instanceof Error ? playwrightError.message : playwrightError);
    const density = Math.max(144, Math.ceil((size / 100) * 96));
    return await sharp(svgPath, { density })
      .resize(size, size, { fit: 'contain', background })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }
}

async function renderLogoWithPlaywright(size) {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    throw new Error('Не удалось отрендерить favicon.svg (sharp/playwright)');
  }

  const svg = readFileSync(svgPath, 'utf8');
  const encoded = encodeURIComponent(svg);
  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });

  await page.setContent(`<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><style>
  html, body { margin: 0; width: ${size}px; height: ${size}px; background: ${background}; }
  img { width: 100%; height: 100%; display: block; object-fit: contain; }
</style></head><body>
  <img src="data:image/svg+xml;charset=utf-8,${encoded}" alt="" />
</body></html>`);

  await page.waitForTimeout(300);
  const buffer = await page.screenshot({ type: 'png', omitBackground: false });
  await browser.close();
  return buffer;
}

async function writeAndroidIcons(sharp, masterBuffer) {
  for (const [folder, size] of Object.entries(LAUNCHER_SIZES)) {
    const dir = path.join(androidRes, folder);
    mkdirSync(dir, { recursive: true });
    const target = path.join(dir, 'ic_launcher.png');
    await sharp(masterBuffer).resize(size, size).png().toFile(target);
    copyFileSync(target, path.join(dir, 'ic_launcher_round.png'));
  }

  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = path.join(androidRes, folder);
    mkdirSync(dir, { recursive: true });
    const inset = Math.round(size * 0.08);
    const inner = size - inset * 2;
    await sharp(masterBuffer)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: inset,
        bottom: inset,
        left: inset,
        right: inset,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }
}

async function writeStoreIcons(sharp, masterBuffer) {
  const publicTarget = path.join(root, 'public', 'icon-512.png');
  const storeDir = path.join(root, 'artifacts', 'rustore', 'store');
  mkdirSync(storeDir, { recursive: true });
  const storeTarget = path.join(storeDir, 'icon-512.png');

  await sharp(masterBuffer).resize(512, 512).png({ compressionLevel: 9 }).toFile(publicTarget);
  copyFileSync(publicTarget, storeTarget);

  return {
    publicTarget,
    storeTarget,
    sizeKb: statSync(publicTarget).size / 1024,
  };
}

async function syncAppIcon() {
  if (!statSync(svgPath, { throwIfNoEntry: false })) {
    throw new Error('Не найден public/favicon.svg');
  }

  const sharp = await loadSharp();
  const masterBuffer = await renderLogoPng(sharp, 1024);
  await writeAndroidIcons(sharp, masterBuffer);
  const store = await writeStoreIcons(sharp, masterBuffer);

  console.log('Иконка: полный логотип (favicon.svg)');
  console.log(`Android mipmap: ${Object.keys(LAUNCHER_SIZES).length} плотностей`);
  console.log(`public/icon-512.png — ${Math.round(store.sizeKb)} KB`);
  console.log(`artifacts/rustore/store/icon-512.png — синхронизирован`);

  return store;
}

export {
  syncAppIcon,
  renderLogoPng,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncAppIcon();
}
