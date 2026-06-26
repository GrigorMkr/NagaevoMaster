/**
 * TXT-запись в DNS REG.RU (Google Search Console и др.).
 *
 *   npm run google:verify-dns
 *
 * deploy/regru.env:
 *   REGRU_API_USERNAME=логин_reg.ru
 *   REGRU_API_PASSWORD=альтернативный_пароль_API
 *   REGRU_DNS_ZONE=nagaevomaster.ru
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, 'deploy/regru.env');

const DEFAULT_TXT = 'google-site-verification=LKU7sDIwG9N0n04SjghLdAnFw1EI_0M-0Pg42BE80nM';

function loadEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

const env = { ...process.env, ...loadEnv(envPath) };
const username = env.REGRU_API_USERNAME;
const password = env.REGRU_API_PASSWORD;
const zone = env.REGRU_DNS_ZONE ?? 'nagaevomaster.ru';
const subdomain = env.REGRU_DNS_TXT_SUBDOMAIN ?? '@';
const text = env.GOOGLE_SITE_VERIFICATION_TXT ?? DEFAULT_TXT;

if (!username || !password) {
  console.error('Нет deploy/regru.env с REGRU_API_USERNAME и REGRU_API_PASSWORD.');
  console.error('Создайте: cp deploy/regru.env.example deploy/regru.env');
  console.error('REG.RU → Настройки API → альтернативный пароль + разрешите ваш IP.');
  console.error('\nИли добавьте TXT вручную в ISPmanager:');
  console.error('https://dnsadmin.hosting.reg.ru/manager/ispmgr');
  console.error(`TXT @ → ${text}`);
  process.exit(1);
}

const body = new URLSearchParams({
  username,
  password,
  domains: JSON.stringify([{ dname: zone }]),
  subdomain,
  text,
  output_content_type: 'json',
});

const res = await fetch('https://api.reg.ru/api/regru2/zone/add_txt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));

if (data.result !== 'success') {
  if (data.error_code === 'ACCESS_DENIED_FROM_IP') {
    console.error('\nДобавьте ваш IP в reg.ru → Настройки API → разрешённые адреса.');
  }
  process.exit(1);
}

console.log(`\nTXT добавлен: ${subdomain === '@' ? zone : `${subdomain}.${zone}`}`);
console.log(`Значение: ${text}`);
console.log('\nПодождите 5–30 мин (иногда до 24 ч), затем «Подтвердить» в Search Console.');
