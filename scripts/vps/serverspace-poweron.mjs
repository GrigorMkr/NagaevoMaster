/**
 * Включить VPN VPS на Serverspace (если выключен).
 *
 *   npm run vps:de:poweron
 */
import { listServers, findServer, ssFetch } from './serverspace-lib.mjs';

const servers = await listServers();
const server = findServer(servers);
if (!server) {
  console.error('Сервер не найден. Запустите: npm run vps:de:status');
  process.exit(1);
}

if (server.is_power_on) {
  console.log(`Сервер ${server.id} уже включён (${server.name}).`);
  process.exit(0);
}

console.log(`Включение ${server.id} (${server.name})...`);
const data = await ssFetch(`/servers/${server.id}/power/on`, { method: 'POST' });
console.log('OK:', JSON.stringify(data.task ?? data, null, 2));
