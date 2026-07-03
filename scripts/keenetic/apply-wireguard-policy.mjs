/**
 * Только туннель WireGuard на Keenetic (без ip policy / hotspot).
 * Политики и их применение — вручную в веб-интерфейсе или CLI.
 *   npm run keenetic:wg-policy
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { keeneticEnv } from './lib.mjs';
import { keeneticRci } from './auth.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envFile = join(root, 'deploy', 'keenetic.env');

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();
  }
}

const env = keeneticEnv();
if (!env.password) {
  console.error('Укажите KEENETIC_PASSWORD или deploy/keenetic.env');
  process.exit(1);
}

const { wgName } = env;

async function showWg() {
  return keeneticRci(`show/interface/${wgName}`, undefined, { method: 'GET' });
}

async function setSecurityPrivate(iface) {
  try {
    await keeneticRci(`interface/${iface}/security-level`, [{ private: true }]);
    console.log(`✓ ${iface} security-level private`);
  } catch {
    console.log(`! security-level ${iface} — пропуск`);
  }
}

console.log(`Keenetic ${env.host} — туннель ${wgName} (политики не трогаем)\n`);

let before = null;
let beforePeer = null;
try {
  before = await showWg();
  beforePeer = before?.wireguard?.peer?.[0];
  console.log(`Было: connected=${before?.connected}, rx=${beforePeer?.rxbytes}, tx=${beforePeer?.txbytes}`);
} catch {
  console.log(`! ${wgName} не найден — сначала: npm run keenetic:wg-import`);
  process.exit(1);
}

const iso = await keeneticRci('isolate-private', [{ no: true }]);
const isoMsg = iso?.[0]?.status?.[0]?.message ?? '';
console.log(/not isolated/i.test(isoMsg) ? '✓ no isolate-private' : `✓ isolate-private: ${isoMsg || 'ok'}`);

await setSecurityPrivate(wgName);

try {
  await keeneticRci(`interface/${wgName}/ip`, [{ 'access-group': [{ no: true }] }]);
  console.log(`✓ файрвол снят с ${wgName}`);
} catch {
  console.log(`! файрвол ${wgName} — пропуск`);
}

try {
  await keeneticRci('ip/nat', [{ interface: wgName }]);
  console.log(`✓ ip nat ${wgName}`);
} catch {
  console.log(`! ip nat — в CLI: ip nat ${wgName}`);
}

console.log('✓ перезапуск Wireguard...');
await keeneticRci(`interface/${wgName}`, [{ up: false }]);
await new Promise((r) => setTimeout(r, 5000));
await keeneticRci(`interface/${wgName}`, [{ up: true }]);

await keeneticRci('system/configuration', [{ save: true }]);
console.log('✓ сохранено');

await new Promise((r) => setTimeout(r, 10000));

const after2 = await showWg();
const peer2 = after2?.wireguard?.peer?.[0];
const rx1 = peer2?.rxbytes ?? 0;
await new Promise((r) => setTimeout(r, 10000));
const after3 = await showWg();
const peer3 = after3?.wireguard?.peer?.[0];
const rxDelta = (peer3?.rxbytes ?? 0) - rx1;

console.log(`\n${wgName}: connected=${after3?.connected}, global=${after3?.global}, security=${after3?.['security-level']}`);
console.log(`rx=${peer3?.rxbytes}, tx=${peer3?.txbytes}, hs=${peer3?.['last-handshake']}s`);
console.log(`Приём за 10с: +${rxDelta} байт`);
console.log('\nПолитики — вручную. Подсказки: deploy/keenetic/cli-wireguard-working.txt');
