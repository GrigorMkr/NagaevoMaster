/**
 * Проверка API-ключа RuStore (console.rustore.ru → API RuStore).
 *
 *   npm run rustore:auth
 *
 * deploy/rustore.env:
 *   RUSTORE_KEY_ID=123456
 *   RUSTORE_PRIVATE_KEY=...   # приватный ключ из консоли (одной строкой)
 */
import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(root, 'deploy', 'rustore.env');

function loadEnv(file) {
  if (!existsSync(file)) return null;
  const vars = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 1) continue;
    vars[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return vars;
}

function formatTimestamp(date = new Date()) {
  const pad = (value, size = 2) => String(value).padStart(size, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hours = pad(Math.floor(abs / 60));
  const minutes = pad(abs % 60);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    + `.${pad(date.getMilliseconds(), 3)}${sign}${hours}:${minutes}`;
}

function buildSignature(privateKeyPem, keyId, timestamp) {
  const payload = `${keyId}${timestamp}`;
  const signer = createSign('RSA-SHA512');
  signer.update(payload);
  signer.end();
  return signer.sign(privateKeyPem).toString('base64');
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

const vars = loadEnv(envPath);
if (!vars?.RUSTORE_KEY_ID || !vars?.RUSTORE_PRIVATE_KEY) {
  console.error('Создайте deploy/rustore.env из deploy/rustore.env.example');
  console.error('Ключ: https://console.rustore.ru/individual/multi-api-key');
  process.exit(1);
}

const keyId = vars.RUSTORE_KEY_ID;
const privateKey = normalizePrivateKey(vars.RUSTORE_PRIVATE_KEY);
const timestamp = formatTimestamp();

let signature;
try {
  signature = buildSignature(privateKey, keyId, timestamp);
} catch (error) {
  console.error('Не удалось подписать запрос. Проверьте RUSTORE_PRIVATE_KEY.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const response = await fetch('https://public-api.rustore.ru/public/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ keyId, timestamp, signature }),
});

const body = await response.text();
if (!response.ok) {
  console.error(`Ошибка ${response.status}: ${body.slice(0, 300)}`);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(body);
} catch {
  console.error('Неожиданный ответ:', body.slice(0, 300));
  process.exit(1);
}

const token = parsed?.body?.jwe ?? parsed?.jwe ?? parsed?.token;
if (!token) {
  console.error('Токен не найден в ответе:', body.slice(0, 300));
  process.exit(1);
}

console.log('RuStore API: авторизация OK');
console.log(`keyId: ${keyId}`);
console.log(`token: ${String(token).slice(0, 48)}…`);
