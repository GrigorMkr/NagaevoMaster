/**
 * Загрузка APK в RuStore через Public API.
 * Вызывается из rustore-deploy.sh после npm run build:rustore.
 *
 * Переменные:
 *   RUSTORE_KEY_ID / RS_KEY_ID
 *   RUSTORE_PRIVATE_KEY / RS_PRIVATE_KEY
 *   RUSTORE_PACKAGE_NAME, RUSTORE_WHATS_NEW, … — см. rustore-deploy.sh
 */
import { createSign } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = 'https://public-api.rustore.ru/public';

function loadLocalEnv() {
  const envPath = path.join(root, 'deploy', 'rustore.env');
  if (!existsSync(envPath)) {
    return;
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
    if (key === 'RUSTORE_KEY_ID' && !process.env.RUSTORE_KEY_ID) {
      process.env.RUSTORE_KEY_ID = value;
    }
    if (key === 'RUSTORE_PRIVATE_KEY' && !process.env.RUSTORE_PRIVATE_KEY) {
      process.env.RUSTORE_PRIVATE_KEY = value;
    }
  }
}

loadLocalEnv();

function env(name, fallback = '') {
  return (process.env[name] ?? fallback).trim();
}

function requireEnv(...names) {
  for (const name of names) {
    const value = env(name);
    if (value) {
      return value;
    }
  }
  console.error(`Не задана переменная: ${names.join(' или ')}`);
  process.exit(1);
}

function formatTimestamp(date = new Date()) {
  const pad = (value, size = 2) => String(value).padStart(size, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    + `.${pad(date.getMilliseconds(), 3)}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function normalizePrivateKey(raw) {
  let key = raw.replace(/\\n/g, '\n').trim();
  if (key.includes('BEGIN')) {
    return key;
  }
  const body = key.replace(/\s/g, '');
  const lines = body.match(/.{1,64}/g) ?? [body];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
}

async function fetchPublicToken(keyId, privateKeyPem) {
  const timestamp = formatTimestamp();
  const signer = createSign('RSA-SHA512');
  signer.update(`${keyId}${timestamp}`);
  signer.end();
  const signature = signer.sign(privateKeyPem).toString('base64');

  const response = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyId, timestamp, signature }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Auth ${response.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }

  const token = body?.body?.jwe ?? body?.jwe ?? body?.token;
  if (!token) {
    throw new Error('Токен RuStore не получен');
  }
  return token;
}

function resolveApkPath() {
  const explicit = env('RUSTORE_APK_PATH');
  if (explicit && existsSync(explicit)) {
    return explicit;
  }

  const artifactsDir = path.join(root, 'artifacts', 'rustore');
  if (!existsSync(artifactsDir)) {
    throw new Error(`Папка не найдена: ${artifactsDir}. Сначала: npm run build:rustore`);
  }

  const apks = readdirSync(artifactsDir)
    .filter((name) => name.endsWith('.apk'))
    .sort();
  if (!apks.length) {
    throw new Error('APK не найден в artifacts/rustore/');
  }
  return path.join(artifactsDir, apks[apks.length - 1]);
}

function readWhatsNew() {
  const fromEnv = env('RUSTORE_WHATS_NEW');
  if (fromEnv) {
    return fromEnv;
  }

  const versionPath = path.join(root, 'mobile', 'app-version.json');
  if (!existsSync(versionPath)) {
    return 'Обновление приложения Нагаево Мастер.';
  }

  const version = JSON.parse(readFileSync(versionPath, 'utf8'));
  if (Array.isArray(version.releaseNotes) && version.releaseNotes.length) {
    return version.releaseNotes.join('\n');
  }
  return `Версия ${version.version ?? ''}`.trim();
}

async function apiJson(token, method, url, payload) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Public-Token': token,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${method} ${url} → ${response.status}: ${text.slice(0, 400)}`);
  }
  return data;
}

async function uploadApk(token, packageName, versionId, apkPath) {
  const fileBuffer = readFileSync(apkPath);
  const form = new FormData();
  form.append('file', new Blob([fileBuffer], { type: 'application/vnd.android.package-archive' }), path.basename(apkPath));

  const url = `${API_BASE}/v1/application/${packageName}/version/${versionId}/apk?servicesType=Unknown&isMainApk=true`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Public-Token': token,
    },
    body: form,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Upload APK ${response.status}: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function main() {
  const keyId = requireEnv('RUSTORE_KEY_ID', 'RS_KEY_ID', 'KEY_ID');
  const privateKeyRaw = requireEnv('RUSTORE_PRIVATE_KEY', 'RS_PRIVATE_KEY', 'PRIVATE_KEY');
  const packageName = env('RUSTORE_PACKAGE_NAME', 'ru.nagaevomaster.app');
  const apkPath = resolveApkPath();

  const categories = JSON.parse(env('RUSTORE_CATEGORIES', '["social"]'));
  const draftBody = {
    appName: env('RUSTORE_APP_NAME', 'НМ'),
    appType: env('RUSTORE_APP_TYPE', 'MAIN'),
    categories,
    ageLegal: env('RUSTORE_AGE_LEGAL', '12+'),
    shortDescription: env('RUSTORE_SHORT_DESCRIPTION', 'Портал Нагаево: мастера, объявления, чаты'),
    fullDescription: env(
      'RUSTORE_FULL_DESCRIPTION',
      'Нагаево Мастер — бесплатный портал посёлка: поиск мастеров, доска объявлений, переписка, форум и сообщества для жителей Нагаево.',
    ),
    whatsNew: readWhatsNew(),
    moderInfo: env('RUSTORE_MODER_INFO', 'Обновление мобильного приложения nagaevomaster.ru'),
    priceValue: Number(env('RUSTORE_PRICE_VALUE', '0')),
    publishType: env('RUSTORE_PUBLISH_TYPE', 'INSTANTLY'),
  };

  console.log(`RuStore deploy: ${packageName}`);
  console.log(`APK: ${path.relative(root, apkPath)}`);

  const token = await fetchPublicToken(keyId, normalizePrivateKey(privateKeyRaw));
  console.log('RuStore auth: OK');

  const draft = await apiJson(
    token,
    'POST',
    `${API_BASE}/v1/application/${packageName}/version`,
    draftBody,
  );

  const versionId = draft?.body?.versionId ?? draft?.versionId;
  if (!versionId) {
    throw new Error(`versionId не получен: ${JSON.stringify(draft).slice(0, 400)}`);
  }
  console.log(`Черновик версии: ${versionId}`);

  await uploadApk(token, packageName, versionId, apkPath);
  console.log('APK загружен');

  const submit = env('RUSTORE_SUBMIT_FOR_MODERATION', 'true').toLowerCase();
  if (submit === 'true' || submit === '1') {
    await apiJson(
      token,
      'POST',
      `${API_BASE}/v1/application/${packageName}/version/${versionId}/commit?priorityUpdate=0`,
    );
    console.log('Отправлено на модерацию');
  } else {
    console.log('Черновик создан без отправки на модерацию (RUSTORE_SUBMIT_FOR_MODERATION=false)');
  }

  console.log(`Готово: https://console.rustore.ru`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
