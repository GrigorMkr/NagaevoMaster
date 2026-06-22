import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'site', 'site-version.json');
const srcDataPath = path.join(root, 'src', 'data', 'siteVersion.json');
const publicPath = path.join(root, 'public', 'site-version.json');

function bumpPatch(version) {
  const parts = String(version).split('.').map((part) => Number(part) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return parts.join('.');
}

function syncSiteVersion({ bumpOnDeploy = false } = {}) {
  const existing = existsSync(sourcePath)
    ? JSON.parse(readFileSync(sourcePath, 'utf8'))
    : { version: '1.0.0', updatedAt: new Date().toISOString().slice(0, 10) };

  const next = {
    version: bumpOnDeploy ? bumpPatch(existing.version) : existing.version,
    updatedAt: bumpOnDeploy
      ? new Date().toISOString().slice(0, 10)
      : existing.updatedAt,
  };

  const json = `${JSON.stringify(next, null, 2)}\n`;
  writeFileSync(sourcePath, json, 'utf8');
  writeFileSync(srcDataPath, json, 'utf8');
  copyFileSync(sourcePath, publicPath);

  console.log(`site-version: v${next.version}, updated ${next.updatedAt}`);
  return next;
}

export {
  syncSiteVersion,
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const bumpOnDeploy = process.argv.includes('--bump');
  syncSiteVersion({ bumpOnDeploy });
}
