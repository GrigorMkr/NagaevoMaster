/**
 * Общие функции nfqws2 на Entware.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execEntware, writeEntwareFile } from './ssh.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const localConf = join(root, 'deploy', 'keenetic', 'nfqws2', 'nfqws2.conf');

export async function detectIspInterface(conn) {
  const r = await execEntware(conn, 'sh -c "route 2>/dev/null | grep ^default | head -1"');
  const parts = r.stdout.trim().split(/\s+/);
  const iface = parts[parts.length - 1] ?? '';
  if (iface) return iface;
  return process.env.NFQWS_ISP_INTERFACE ?? 'eth3';
}

export async function uploadNfqws2Config(conn, { ispInterface } = {}) {
  if (!existsSync(localConf)) {
    throw new Error(`Нет ${localConf}`);
  }
  let text = readFileSync(localConf, 'utf8');
  const iface = ispInterface ?? process.env.NFQWS_ISP_INTERFACE ?? 'eth3';
  text = text.replace(/^ISP_INTERFACE=".*"/m, `ISP_INTERFACE="${iface}"`);

  await execEntware(conn, 'sh -c "mkdir -p /opt/etc/nfqws2"');
  await writeEntwareFile(conn, '/opt/etc/nfqws2/nfqws2.conf', text);
  return iface;
}

export async function nfqws2ServiceCmd(conn, action) {
  const script = `
export PATH=/opt/sbin:/opt/bin:/opt/usr/sbin:/opt/usr/bin:$PATH
if [ -x /opt/etc/init.d/S51nfqws2 ]; then
  /opt/etc/init.d/S51nfqws2 ${action}
elif [ -x /opt/etc/init.d/nfqws2-keenetic ]; then
  /opt/etc/init.d/nfqws2-keenetic ${action}
else
  echo "init-скрипт nfqws2 не найден"
  exit 1
fi
`;
  return execEntware(conn, `sh -c ${JSON.stringify(script)}`);
}
