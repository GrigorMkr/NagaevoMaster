/**
 * Подготовка Android-подписи и секретов для GitFlic CI / self-hosted runner.
 *
 * Переменные CI/CD (GitFlic → Настройки → CI/CD):
 *   ANDROID_KEYSTORE_BASE64 — base64 файла android/nagaevomaster-release.keystore
 *   ANDROID_KEYSTORE_PASSWORD
 *   ANDROID_KEY_ALIAS — по умолчанию nagaevomaster
 *   ANDROID_KEY_PASSWORD — если не задан, = ANDROID_KEYSTORE_PASSWORD
 *   GOOGLE_SERVICES_JSON — содержимое google-services.json (или base64)
 *   VK_MAPS_API_KEY — опционально, для bundled-карт
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const androidDir = path.join(root, 'android');

function decodeMaybeBase64(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) {
    return trimmed;
  }
  return Buffer.from(trimmed, 'base64').toString('utf8');
}

function writeKeystore() {
  const base64 = process.env.ANDROID_KEYSTORE_BASE64?.trim();
  const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD?.trim();
  const keyAlias = process.env.ANDROID_KEY_ALIAS?.trim() || 'nagaevomaster';
  const keyPassword = process.env.ANDROID_KEY_PASSWORD?.trim() || storePassword;

  if (!base64 || !storePassword) {
    console.error('Задайте ANDROID_KEYSTORE_BASE64 и ANDROID_KEYSTORE_PASSWORD в CI/CD.');
    process.exit(1);
  }

  const keystorePath = path.join(androidDir, 'nagaevomaster-release.keystore');
  writeFileSync(keystorePath, Buffer.from(base64, 'base64'));

  const props = [
    'storeFile=nagaevomaster-release.keystore',
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`,
    '',
  ].join('\n');
  writeFileSync(path.join(androidDir, 'keystore.properties'), props, 'utf8');
  console.log('Android keystore: OK');
}

function writeGoogleServices() {
  const raw = process.env.GOOGLE_SERVICES_JSON?.trim();
  if (!raw) {
    console.warn('GOOGLE_SERVICES_JSON не задан — push в APK может не работать.');
    return;
  }

  const json = decodeMaybeBase64(raw);
  const target = path.join(root, 'deploy', 'google-services.json');
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, json.endsWith('\n') ? json : `${json}\n`, 'utf8');
  console.log('google-services.json: OK');
}

function writeVkMaps() {
  const key = process.env.VK_MAPS_API_KEY?.trim();
  if (!key) {
    return;
  }
  const target = path.join(root, 'deploy', 'vkmaps.env');
  writeFileSync(target, `VK_MAPS_API_KEY=${key}\n`, 'utf8');
  console.log('vkmaps.env: OK');
}

if (existsSync(path.join(androidDir, 'keystore.properties'))
  && existsSync(path.join(androidDir, 'nagaevomaster-release.keystore'))) {
  console.log('Keystore уже на месте — пропуск ANDROID_KEYSTORE_*');
} else {
  writeKeystore();
}

writeGoogleServices();
writeVkMaps();
