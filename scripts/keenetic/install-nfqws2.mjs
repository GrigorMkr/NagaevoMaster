/**
 * Установка nfqws2-keenetic на роутер (Entware + opkg).
 * Политики Keenetic не трогает — только пакет и конфиг.
 *
 *   npm run keenetic:nfqws2:install
 *
 * Перед установкой вручную на роутере:
 *   - Entware (OPKG)
 *   - «Модули ядра Netfilter»
 *   - отключить сторонние DNS-фильтры
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectEntware, execEntware } from './ssh.mjs';
import { uploadNfqws2Config, detectIspInterface, nfqws2ServiceCmd } from './nfqws2-lib.mjs';

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

const REPO = 'https://nfqws.github.io/nfqws2-keenetic/all';

const installScript = `
set -e
if [ ! -d /opt/etc ]; then
  echo "Нет /opt — сначала установите Entware на роутере"
  exit 1
fi
export PATH=/opt/sbin:/opt/bin:/opt/usr/sbin:/opt/usr/bin:$PATH
opkg remove nfqws-keenetic-web nfqws-keenetic 2>/dev/null || true
opkg update
opkg install ca-certificates wget-ssl
opkg remove wget-nossl 2>/dev/null || true
mkdir -p /opt/etc/opkg
echo "src/gz nfqws2-keenetic ${REPO}" > /opt/etc/opkg/nfqws2-keenetic.conf
opkg update
opkg install nfqws2-keenetic
echo "=== installed ==="
opkg info nfqws2-keenetic | head -5
`;

console.log('Подключение к Entware (SSH root)...');
const conn = await connectEntware();

try {
  console.log('Установка nfqws2-keenetic...');
  const install = await execEntware(conn, `sh -c ${JSON.stringify(installScript)}`, { timeoutMs: 300000 });
  process.stdout.write(install.stdout);
  if (install.stderr) process.stderr.write(install.stderr);
  if (install.code !== 0) {
    console.error(`\nopkg install завершился с кодом ${install.code}`);
    process.exit(1);
  }

  const iface = await detectIspInterface(conn);
  console.log(`\nИнтерфейс провайдера: ${iface}`);
  await uploadNfqws2Config(conn, { ispInterface: iface });

  const svc = await nfqws2ServiceCmd(conn, 'restart');
  process.stdout.write(svc.stdout);
  if (svc.stderr) process.stderr.write(svc.stderr);

  const st = await nfqws2ServiceCmd(conn, 'status');
  console.log('\n' + st.stdout.trim());

  console.log('\nГотово. Политику «nfqws» создайте и назначьте устройства вручную в веб-интерфейсе.');
  console.log('Документация: deploy/KEENETIC-NFQWS2.md');
} finally {
  conn.end();
}
