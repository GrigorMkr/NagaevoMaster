import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const downloadDir = path.join(root, 'public', 'downloads');
const stashDir = path.join(root, '.build-stash', 'public-downloads-apk');

function stashPublicApkDownloads() {
  mkdirSync(stashDir, { recursive: true });
  const stashed = [];

  if (!existsSync(downloadDir)) {
    return { stashed, restore: () => undefined };
  }

  for (const name of readdirSync(downloadDir)) {
    if (!name.toLowerCase().endsWith('.apk')) continue;
    renameSync(path.join(downloadDir, name), path.join(stashDir, name));
    stashed.push(name);
  }

  const restore = () => {
    if (stashed.length === 0) return;
    mkdirSync(downloadDir, { recursive: true });
    for (const name of stashed) {
      renameSync(path.join(stashDir, name), path.join(downloadDir, name));
    }
    rmSync(stashDir, { recursive: true, force: true });
  };

  return { stashed, restore };
}

function removeDistApkDownloads(distDir = path.join(root, 'dist')) {
  const distDownloads = path.join(distDir, 'downloads');
  if (!existsSync(distDownloads)) return 0;

  let removed = 0;
  for (const name of readdirSync(distDownloads)) {
    if (!name.toLowerCase().endsWith('.apk')) continue;
    rmSync(path.join(distDownloads, name), { force: true });
    removed += 1;
  }
  return removed;
}

export {
  stashPublicApkDownloads,
  removeDistApkDownloads,
};
