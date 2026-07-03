/**
 * Залить локальный nfqws2.conf и перезапустить службу.
 *   npm run keenetic:nfqws2:config
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectEntware } from './ssh.mjs';
import { detectIspInterface, uploadNfqws2Config, nfqws2ServiceCmd } from './nfqws2-lib.mjs';

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

const conn = await connectEntware();
try {
  const iface = process.env.NFQWS_ISP_INTERFACE ?? await detectIspInterface(conn);
  await uploadNfqws2Config(conn, { ispInterface: iface });
  console.log(`Конфиг записан, ISP_INTERFACE=${iface}`);
  const r = await nfqws2ServiceCmd(conn, 'restart');
  process.stdout.write(r.stdout);
  const st = await nfqws2ServiceCmd(conn, 'status');
  console.log('\n' + st.stdout.trim());
} finally {
  conn.end();
}
