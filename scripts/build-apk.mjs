import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureAndroidKeystore } from './ensure-android-keystore.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');

function listMicrosoftJdks() {
  const base = 'C:\\Program Files\\Microsoft';
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('jdk-'))
    .map((entry) => path.join(base, entry.name));
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

function ensureLocalProperties(androidSdk) {
  const localProps = path.join(androidDir, 'local.properties');
  const content = `sdk.dir=${androidSdk.replace(/\\/g, '\\\\')}\n`;
  writeFileSync(localProps, content, 'utf8');
}

const JDK_CANDIDATES = [
  process.env.JAVA_HOME,
  process.env.JDK_HOME,
  `${process.env.ProgramFiles}\\Android\\Android Studio\\jbr`,
  `${process.env.LOCALAPPDATA}\\Programs\\Android\\Android Studio\\jbr`,
  'C:\\Program Files\\Android\\Android Studio\\jbr',
  ...listMicrosoftJdks().sort((a, b) => b.localeCompare(a)),
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17',
].filter(Boolean);

function readJavaMajorVersion(javaHome) {
  const javaExe = path.join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  const result = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const output = `${result.stderr ?? ''}${result.stdout ?? ''}`;
  const match = output.match(/version "(\d+)/);
  return match ? Number(match[1]) : 0;
}

function findJavaHome() {
  let fallback = null;

  for (const candidate of JDK_CANDIDATES) {
    const javaExe = path.join(candidate, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (!existsSync(javaExe)) continue;

    const major = readJavaMajorVersion(candidate);
    if (major >= 21) return candidate;
    if (!fallback) fallback = candidate;
  }

  return fallback;
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
ensureLocalProperties(androidSdk);

try {
  ensureAndroidKeystore(javaHome);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

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
