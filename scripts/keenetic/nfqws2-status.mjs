/**
 * Статус nfqws2 на Keenetic (Entware).
 *   npm run keenetic:nfqws2:status
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectEntware, execEntware } from './ssh.mjs';
import { nfqws2ServiceCmd } from './nfqws2-lib.mjs';

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

const checks = `
export PATH=/opt/sbin:/opt/bin:/opt/usr/sbin:/opt/usr/bin:$PATH
echo "=== OPKG ==="
opkg info nfqws2-keenetic 2>/dev/null | head -6 || echo "не установлен"
echo "=== PROCESS ==="
pgrep -af nfqws2 2>/dev/null || echo "процесс не найден"
echo "=== CONFIG ISP ==="
grep '^ISP_INTERFACE=' /opt/etc/nfqws2/nfqws2.conf 2>/dev/null || true
grep '^POLICY_NAME=' /opt/etc/nfqws2/nfqws2.conf 2>/dev/null || true
echo "=== IPTABLES ==="
iptables-save 2>/dev/null | grep nfqws | head -5 || echo "правил nfqws нет"
echo "=== LOG (tail) ==="
tail -3 /opt/var/log/nfqws2.log 2>/dev/null || echo "лог пуст"
`;

console.log('Entware SSH...');
const conn = await connectEntware();
try {
  const st = await nfqws2ServiceCmd(conn, 'status');
  console.log(st.stdout.trim());
  console.log('');
  const r = await execEntware(conn, `sh -c ${JSON.stringify(checks)}`);
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
} finally {
  conn.end();
}
