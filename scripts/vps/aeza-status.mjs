/**
 * Статус услуг Aeza.
 *
 *   deploy/vps-de.env → AEZA_API_KEY=...
 *   npm run vps:aeza:status
 */
import { listServices, findService } from './aeza-lib.mjs';

const services = await listServices();

if (!services.length) {
  console.log('Услуг не найдено.');
  process.exit(0);
}

console.log('Aeza — серверы:\n');
for (const s of services) {
  const ip = s.ip ?? s.parameters?.ip ?? '—';
  console.log(`  id=${s.id}  ${s.name ?? '—'}  status=${s.status}  ip=${ip}`);
}

const match = findService(services);
if (match) {
  console.log(`\nVPN-сервер: id=${match.id} (${match.name}) status=${match.status}`);
  console.log(`Добавьте в deploy/vps-de.env: AEZA_SERVICE_ID=${match.id}`);
} else {
  console.log('\nНе найден по VPS_DE_HOST. Укажите AEZA_SERVICE_ID вручную.');
}
