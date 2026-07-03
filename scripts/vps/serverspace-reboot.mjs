/**
 * Перезагрузка VPN VPS на Serverspace.
 *
 *   npm run vps:de:reboot
 */
import { listServers, findServer, ssFetch } from './serverspace-lib.mjs';

const servers = await listServers();
const server = findServer(servers);
if (!server) {
  console.error('Сервер не найден. Запустите: npm run vps:de:status');
  process.exit(1);
}

console.log(`Перезагрузка ${server.id} (${server.name})...`);
const data = await ssFetch(`/servers/${server.id}/power/reboot`, { method: 'POST' });
console.log('OK:', JSON.stringify(data.task ?? data, null, 2));
console.log('Через 1–2 мин: ping 213.176.95.209 и npm run vps:wireguard:reinstall');
