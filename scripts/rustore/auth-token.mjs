/**
 * Проверка API-ключа RuStore (console.rustore.ru → API RuStore).
 *
 *   npm run rustore:auth
 *
 * deploy/rustore.env:
 *   RUSTORE_KEY_ID=123456
 *   RUSTORE_PRIVATE_KEY=...   # приватный ключ из консоли (одной строкой)
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRuStoreAuthBody, formatRuStoreTimestamp, RUSTORE_AUTH_URL } from './rustore-key.mjs';

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

const vars = loadEnv(envPath);
if (!vars?.RUSTORE_KEY_ID || !vars?.RUSTORE_PRIVATE_KEY) {
  console.error('Создайте deploy/rustore.env из deploy/rustore.env.example');
  console.error('Ключ: https://console.rustore.ru/individual/multi-api-key');
  process.exit(1);
}

const keyId = vars.RUSTORE_KEY_ID;
const timestamp = formatRuStoreTimestamp();

let authBody;
try {
  authBody = buildRuStoreAuthBody(keyId, timestamp, vars.RUSTORE_PRIVATE_KEY);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const response = await fetch(RUSTORE_AUTH_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(authBody),
});

const body = await response.text();
if (!response.ok) {
  console.error(`Ошибка ${response.status}: ${body.slice(0, 300)}`);
  if (body.includes('Signature encode error')) {
    console.error('');
    console.error('Подпись формируется корректно локально, но RuStore её отклоняет.');
    console.error('Проверьте, что RUSTORE_KEY_ID совпадает с ID ключа в консоли для этого private key.');
    console.error('Если ключ обновляли в консоли — создайте новый ключ и сохраните новую пару keyId + private key.');
    console.error(`keyId: ${keyId}, timestamp: ${timestamp}`);
  }
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
