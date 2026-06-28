/**
 * Краткая PDF-презентация для друзей.
 *
 *   npm run presentation:friends
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const presentationDir = path.join(root, 'docs', 'presentation');
const htmlPath = path.join(presentationDir, 'friends.html');
const pdfPath = path.join(presentationDir, 'NagaevoMaster-friends.pdf');

async function main() {
  let playwright;
  try {
    playwright = await import('playwright');
  } catch {
    console.error('Установите Playwright: npx playwright install chromium');
    process.exit(1);
  }

  const { chromium } = playwright;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();

  console.log(`PDF: ${path.relative(root, pdfPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
