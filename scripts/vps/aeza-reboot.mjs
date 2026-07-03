/**
 * Перезагрузка VPS на Aeza.
 *
 *   npm run vps:aeza:reboot
 */
import { listServices, findService, serviceAction } from './aeza-lib.mjs';

const services = await listServices();
const service = findService(services);
if (!service) {
  console.error('Сервер не найден. Запустите: npm run vps:aeza:status');
  process.exit(1);
}

console.log(`Перезагрузка ${service.id} (${service.name})...`);
const data = await serviceAction(service.id, 'reboot');
console.log('OK:', JSON.stringify(data, null, 2));
console.log('\nЧерез 1–2 мин: ping 213.176.95.209');
console.log('$env:VPS_HOST="213.176.95.209"; npm run vps:wireguard:reinstall');
