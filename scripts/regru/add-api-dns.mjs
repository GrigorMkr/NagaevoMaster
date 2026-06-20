/**
 * Добавляет A-запись api → VPS через REG.API 2.
 * Требует deploy/regru.env и разрешённый IP в reg.ru → Настройки API.
 *
 *   node scripts/regru/add-api-dns.mjs
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
const username = env.REGRU_API_USERNAME;
const password = env.REGRU_API_PASSWORD;
const zone = env.REGRU_DNS_ZONE ?? 'nagaevomaster.ru';
const subdomain = env.REGRU_DNS_SUBDOMAIN ?? 'api';
const ipaddr = env.REGRU_VPS_IP ?? '161.104.18.17';

if (!username || !password) {
  console.error('Заполните REGRU_API_USERNAME и REGRU_API_PASSWORD в deploy/regru.env');
  process.exit(1);
}

const body = new URLSearchParams({
  username,
  password,
  domains: JSON.stringify([{ dname: zone }]),
  subdomain,
  ipaddr,
  output_content_type: 'json',
});

const res = await fetch('https://api.reg.ru/api/regru2/zone/add_alias', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));

if (data.result !== 'success') {
  if (data.error_code === 'ACCESS_DENIED_FROM_IP') {
    console.error('\nДобавьте ваш IP в reg.ru → Настройки API → разрешённые адреса.');
    console.error('Текущий IP: curl https://api.ipify.org');
  }
  process.exit(1);
}

console.log(`\nГотово: ${subdomain}.${zone} → ${ipaddr}`);
