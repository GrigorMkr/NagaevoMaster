import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('1/3 Сборка веб-приложения…');
run('npm', ['run', 'build:hosting']);

console.log('2/3 Синхронизация Capacitor…');
run('npx', ['cap', 'sync']);

const downloadsDir = path.join(root, 'public', 'downloads');
mkdirSync(downloadsDir, { recursive: true });

const apkSrc = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
const apkDst = path.join(downloadsDir, 'nagaevomaster.apk');

if (existsSync(apkSrc)) {
  copyFileSync(apkSrc, apkDst);
  console.log('3/3 APK скопирован в public/downloads/nagaevomaster.apk');
} else {
  console.log('3/3 APK не найден. Соберите Android: npm run build:apk');
}

console.log('\nГотово. iOS: откройте ios/App в Xcode на Mac.');
