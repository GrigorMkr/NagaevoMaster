/**
 * Статус VPS на Serverspace (Германия).
 *
 *   1. deploy/vps-de.env → SERVERSPACE_API_KEY=...
 *   2. npm run vps:de:status
 */
import { listServers, findServer, loadVpsDeEnv } from './serverspace-lib.mjs';

const env = loadVpsDeEnv();
const servers = await listServers(env);

if (!servers.length) {
  console.log('Серверов не найдено.');
  process.exit(0);
}

console.log('Serverspace — серверы:\n');
for (const s of servers) {
  const ips = (s.nics ?? []).map((n) => n.ip_address).filter(Boolean).join(', ');
  console.log(`  ${s.id}  ${s.name}  power=${s.is_power_on ? 'ON' : 'OFF'}  state=${s.state}  ip=${ips}`);
}

const match = findServer(servers, env);
if (match) {
  console.log(`\nВаш VPN-сервер: ${match.id} (${match.name})`);
  console.log(`Добавьте в deploy/vps-de.env: SERVERSPACE_SERVER_ID=${match.id}`);
} else {
  console.log('\nНе найден сервер по VPS_DE_HOST. Укажите SERVERSPACE_SERVER_ID вручную.');
}
