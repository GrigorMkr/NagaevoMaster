/**
 * Статус VPS через Cloud API (токен из deploy/regru.env).
 *
 *   node scripts/regru/cloud-status.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, 'deploy/regru.env');

function loadEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

const env = { ...process.env, ...loadEnv(envPath) };
const token = env.REGRU_CLOUD_TOKEN;

if (!token) {
  console.error('Заполните REGRU_CLOUD_TOKEN в deploy/regru.env');
  process.exit(1);
}

const res = await fetch('https://api.cloudvps.reg.ru/v1/reglets', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const data = await res.json();
if (!res.ok) {
  console.error(data);
  process.exit(1);
}

for (const r of data.reglets ?? []) {
  console.log(`${r.name}: ${r.ip} (${r.status}) id=${r.id}`);
}
