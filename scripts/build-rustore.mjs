/**
 * Сборка APK + AAB для публикации в RuStore.
 *
 *   npm run build:rustore
 *
 * Артефакты: artifacts/rustore/
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findJavaHome } from './resolve-java-home.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const artifactsDir = path.join(root, 'artifacts', 'rustore');

function readVersion() {
  const gradle = readFileSync(path.join(androidDir, 'app', 'build.gradle'), 'utf8');
  return {
    version: gradle.match(/versionName\s+"([^"]+)"/)?.[1] ?? '0.0.0',
    versionCode: gradle.match(/versionCode\s+(\d+)/)?.[1] ?? '0',
  };
}

function copyReleaseArtifacts() {
  const { version } = readVersion();
  const apkSrc = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  const aabSrc = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');

  if (!existsSync(apkSrc)) {
    console.error('APK не найден после сборки.');
    return false;
  }

  mkdirSync(artifactsDir, { recursive: true });

  const apkDst = path.join(artifactsDir, `nagaevomaster-${version}.apk`);
  copyFileSync(apkSrc, apkDst);

  const apkMb = (statSync(apkSrc).size / (1024 * 1024)).toFixed(1);
  console.log(`Bundled APK: artifacts/rustore/nagaevomaster-${version}.apk (${apkMb} МБ)`);

  if (existsSync(aabSrc)) {
    const aabDst = path.join(artifactsDir, `nagaevomaster-${version}.aab`);
    copyFileSync(aabSrc, aabDst);
    const aabMb = (statSync(aabSrc).size / (1024 * 1024)).toFixed(1);
    console.log(`AAB: artifacts/rustore/nagaevomaster-${version}.aab (${aabMb} МБ)`);
  } else {
    console.warn('AAB не собран — для RuStore достаточно подписанного APK.');
  }

  return true;
}

const apkBuild = spawnSync('node', ['scripts/build-apk.mjs'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CAPACITOR_BUNDLED: '1' },
});

if (apkBuild.status !== 0) {
  process.exit(apkBuild.status ?? 1);
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error('JDK не найден');
  process.exit(1);
}

const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const bundle = spawnSync(gradle, ['bundleRelease'], {
  cwd: androidDir,
  env: { ...process.env, JAVA_HOME: javaHome },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (bundle.status !== 0) {
  console.warn('bundleRelease не удался — продолжаем только с APK.');
}

if (!copyReleaseArtifacts()) {
  process.exit(1);
}

const cert = spawnSync('node', ['scripts/rustore/export-signing-cert.mjs'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (cert.status !== 0) {
  process.exit(cert.status ?? 1);
}

console.log(`
Готово для RuStore Console (bundled APK — вшитый сайт, быстрый UI):
  1. https://console.rustore.ru → Приложения → Добавить
  2. Package: ru.nagaevomaster.app
  3. Загрузить версию → APK из artifacts/rustore/
  4. Инструкция: mobile/RUSTORE.md

Лёгкий APK для сайта (/downloads): npm run build:apk
`);
