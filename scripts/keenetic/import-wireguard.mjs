/**
 * Импорт WireGuard на Keenetic (KeeneticOS 5.x, RCI).
 *
 *   npm run keenetic:wg-import
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { keeneticRci, keeneticRciBatch } from './auth.mjs';
import { keeneticEnv, requirePassword } from './lib.mjs';

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
requirePassword(env);

const confPath = process.env.WG_CONF
  ?? join(root, 'artifacts', 'wireguard', 'keenetic-router.conf');

if (!existsSync(confPath)) {
  console.error(`Нет файла ${confPath}`);
  process.exit(1);
}

const confText = readFileSync(confPath, 'utf8');

function parseConf(text) {
  const sections = { Interface: {}, Peer: {} };
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^\[(\w+)\]$/);
    if (m) { cur = m[1]; continue; }
    const kv = t.match(/^(\w+)\s*=\s*(.+)$/);
    if (kv && cur) sections[cur][kv[1]] = kv[2].trim();
  }
  return sections;
}

function rciErrors(body) {
  const errors = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node.status)) {
      for (const s of node.status) {
        if (s?.status === 'error') errors.push(s.message ?? JSON.stringify(s));
      }
    }
    for (const v of Object.values(node)) walk(v);
  };
  walk(body);
  return errors;
}

const { Interface: iface, Peer: peer } = parseConf(confText);
const name = env.wgName;
const address = iface.Address?.split('/')[0] ?? '10.66.66.3';
const mask = iface.Address?.includes('/32') ? '255.255.255.255' : '255.255.255.0';
const mtu = Number(iface.MTU ?? 1320);
const endpoint = peer.Endpoint ?? '';
const [epHost, epPort] = endpoint.includes(':') ? endpoint.split(':') : [endpoint, '51820'];
const keepalive = Number(peer.PersistentKeepalive ?? 25);

async function wgExists() {
  try {
    const row = await keeneticRci(`show/interface/${name}`, undefined, { method: 'GET', env });
    return row?.id ? row : null;
  } catch {
    return null;
  }
}

console.log('Авторизация...');
const existing = await wgExists();
if (existing) {
  console.log(`${name} уже есть (connected=${existing.connected}) — включаем...`);
  await keeneticRci(`interface/${name}`, [{ up: true, description: 'Nagaevo VPN DE' }], { env });
  await keeneticRci('system/configuration', [{ save: true }], { env });
  console.log('\nДальше: npm run keenetic:wg-policy');
  console.log('Политики — вручную (deploy/keenetic/cli-wireguard-working.txt)');
  process.exit(0);
}

console.log(`Создаём ${name}...`);
const created = await keeneticRciBatch([{ interface: { name } }], { env });
const createErrors = rciErrors(created?.[0]);
if (createErrors.length && !createErrors.some((m) => /created/i.test(m))) {
  console.error('Не удалось создать интерфейс:', createErrors.join('; '));
  process.exit(1);
}

const configured = await keeneticRciBatch([{
  interface: {
    [name]: {
      description: 'Nagaevo VPN DE',
      up: true,
      wireguard: {
        'private-key': iface.PrivateKey,
        peer: [{
          key: peer.PublicKey,
          endpoint: { address: `${epHost}:${epPort}` },
          'keepalive-interval': { interval: keepalive },
          'allow-ips': [{ address: '0.0.0.0', mask: '0.0.0.0' }],
        }],
      },
    },
  },
}], { env });

const cfgErrors = rciErrors(configured?.[0]);
if (cfgErrors.length) {
  console.error('Ошибка настройки WireGuard:', cfgErrors.join('; '));
  process.exit(1);
}

await keeneticRci(`interface/${name}/ip`, [{
  address,
  mask,
  mtu,
  dhcp: { no: true },
}], { env });

await keeneticRci('system/configuration', [{ save: true }], { env });

const after = await wgExists();
if (!after?.id) {
  console.error(`Интерфейс ${name} не появился после импорта.`);
  console.error('Импортируйте вручную: Интернет → Другие подключения → WireGuard → Импорт из файла');
  console.error(confPath);
  process.exit(1);
}

console.log(`\nГотово: ${name} создан (connected=${after.connected}).`);
console.log('\nДальше: npm run keenetic:wg-policy');
console.log('Политики — вручную (deploy/keenetic/cli-wireguard-working.txt)');
console.log('\nФайл конфига:', confPath);
