import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAndroidKeystore } from './ensure-android-keystore.mjs';
import { findJavaHome } from './resolve-java-home.mjs';
import { syncAndroidAssetLinks } from './sync-android-assetlinks.mjs';
import { syncAppVersion } from './sync-app-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');

function ensureLocalProperties(androidSdk, javaHome) {
  const localProps = path.join(androidDir, 'local.properties');
  const escapePropertyPath = (value) => value.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  const content = [
    `sdk.dir=${escapePropertyPath(androidSdk)}`,
    `java.home=${escapePropertyPath(javaHome)}`,
    '',
  ].join('\n');
  writeFileSync(localProps, content, 'utf8');
}

function findAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    'C:\\Android\\Sdk',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const platforms = path.join(candidate, 'platforms');
    if (existsSync(platforms)) {
      return candidate;
    }
  }
  return null;
}

function syncCapacitorShellSplash() {
  const shellDir = path.join(root, 'mobile', 'capacitor-shell');
  const shellBackgroundsDir = path.join(shellDir, 'backgrounds');
  mkdirSync(shellBackgroundsDir, { recursive: true });
  for (const file of ['boot-splash.css', 'favicon.svg']) {
    copyFileSync(path.join(root, 'public', file), path.join(shellDir, file));
  }
  copyFileSync(
    path.join(root, 'public', 'backgrounds', 'desktop-red-lake.jpg'),
    path.join(shellBackgroundsDir, 'desktop-red-lake.jpg'),
  );
}

function runCapSync(javaHome) {
  const env = {
    ...process.env,
    JAVA_HOME: javaHome,
    CAPACITOR_WEB_DIR: 'mobile/capacitor-shell',
  };
  const result = spawnSync('npx', ['cap', 'sync', 'android'], {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: true,
  });
  return result.status ?? 1;
}

function runGradle(javaHome) {
  const env = { ...process.env, JAVA_HOME: javaHome };
  const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const args = process.platform === 'win32'
    ? ['assembleRelease']
    : ['assembleRelease'];

  const result = spawnSync(gradle, args, {
    cwd: androidDir,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  return result.status ?? 1;
}

function copyApk() {
  const signedSrc = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  const unsignedSrc = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');

  if (!existsSync(signedSrc)) {
    if (existsSync(unsignedSrc)) {
      console.error('Собран неподписанный APK — установка на телефон невозможна.');
      console.error('Проверьте android/keystore.properties и пересоберите: npm run build:apk');
    } else {
      console.warn('APK не найден после сборки.');
    }
    return false;
  }

  const targets = [
    path.join(root, 'public', 'downloads', 'nagaevomaster.apk'),
    path.join(root, 'dist', 'downloads', 'nagaevomaster.apk'),
  ];

  for (const dst of targets) {
    mkdirSync(path.dirname(dst), { recursive: true });
    copyFileSync(signedSrc, dst);
    const sizeMb = statSync(dst).size / (1024 * 1024);
    console.log(`APK скопирован: ${path.relative(root, dst)} (${sizeMb.toFixed(1)} МБ)`);
  }

  return true;
}

const javaHome = findJavaHome();

if (!javaHome) {
  console.error(`
Не найден Java (JDK 21+).

Установите один из вариантов:

  1) Android Studio (рекомендуется — включает JDK 21):
     https://developer.android.com/studio

  2) Microsoft OpenJDK 21:
     winget install Microsoft.OpenJDK.21

После установки перезапустите терминал и снова:
  npm run build:apk

Или укажите путь вручную:
  set JAVA_HOME=C:\\Program Files\\Microsoft\\jdk-17.x.x
  npm run build:apk
`);
  process.exit(1);
}

console.log(`JAVA_HOME: ${javaHome}`);

const androidSdk = findAndroidSdk();
if (!androidSdk) {
  console.error(`
Не найден Android SDK.

Установите Android Studio:
  winget install Google.AndroidStudio

После установки откройте Android Studio один раз — он скачает SDK.
Затем перезапустите терминал и снова:
  npm run build:apk

Или укажите путь вручную:
  set ANDROID_HOME=%LOCALAPPDATA%\\Android\\Sdk
  npm run build:apk
`);
  process.exit(1);
}

console.log(`ANDROID_SDK: ${androidSdk}`);
ensureLocalProperties(androidSdk, javaHome);

try {
  ensureAndroidKeystore(javaHome);
  syncAndroidAssetLinks(javaHome);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

syncCapacitorShellSplash();
const syncCode = runCapSync(javaHome);
if (syncCode !== 0) {
  process.exit(syncCode);
}

const configureResult = spawnSync('node', ['scripts/configure-android-push.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (configureResult.status !== 0) {
  process.exit(configureResult.status ?? 1);
}

const code = runGradle(javaHome);
if (code !== 0) {
  process.exit(code);
}

if (!copyApk()) {
  process.exit(1);
}

syncAppVersion({ bumpDate: true });
