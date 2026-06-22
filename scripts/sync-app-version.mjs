import { copyFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
const sourcePath = path.join(root, 'mobile', 'app-version.json');
const publicPath = path.join(root, 'public', 'app-version.json');
const srcDataPath = path.join(root, 'src', 'data', 'appVersion.json');
const apkPath = path.join(root, 'public', 'downloads', 'nagaevomaster.apk');

function readGradleVersion() {
  if (!existsSync(gradlePath)) {
    return null;
  }
  const gradle = readFileSync(gradlePath, 'utf8');
  const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
  const versionCode = Number(gradle.match(/versionCode\s+(\d+)/)?.[1] ?? 0);
  if (!versionName) return null;
  return { versionName, versionCode };
}

function readApkSizeMb() {
  if (!existsSync(apkPath)) return null;
  return Math.round((statSync(apkPath).size / (1024 * 1024)) * 10) / 10;
}

function syncAppVersion({ bumpDate = false } = {}) {
  const gradle = readGradleVersion();
  const existing = existsSync(sourcePath)
    ? JSON.parse(readFileSync(sourcePath, 'utf8'))
    : {};

  const next = {
    version: gradle?.versionName ?? existing.version ?? '1.0.0',
    versionCode: gradle?.versionCode ?? existing.versionCode ?? 1,
    releasedAt: bumpDate
      ? new Date().toISOString().slice(0, 10)
      : (existing.releasedAt ?? new Date().toISOString().slice(0, 10)),
    apkSizeMb: readApkSizeMb() ?? existing.apkSizeMb ?? 3,
    releaseNotes: Array.isArray(existing.releaseNotes) ? existing.releaseNotes : [],
  };

  const json = `${JSON.stringify(next, null, 2)}\n`;
  writeFileSync(sourcePath, json, 'utf8');
  writeFileSync(srcDataPath, json, 'utf8');
  copyFileSync(sourcePath, publicPath);

  console.log(`app-version: v${next.version} (${next.versionCode}), APK ~${next.apkSizeMb} МБ`);
  return next;
}

export {
  syncAppVersion,
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const bumpDate = process.argv.includes('--bump-date');
  syncAppVersion({ bumpDate });
}
