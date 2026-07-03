/**
 * Полная установка nfqws2: Entware (если нет) + пакет + конфиг.
 * Политики Keenetic не трогает.
 *
 *   npm run keenetic:nfqws2:setup
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectEntware, execEntware, entwareSshConfig, writeEntwareFile } from './ssh.mjs';
import { telnetExecSh, telnetCli } from './telnet.mjs';
import { uploadNfqws2Config, nfqws2ServiceCmd } from './nfqws2-lib.mjs';
import { keeneticEnv } from './lib.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envFile = join(root, 'deploy', 'keenetic.env');
const REPO = 'https://nfqws.github.io/nfqws2-keenetic/all';
const ENTWARE_INSTALLER = 'https://bin.entware.net/mipselsf-k3.4/installer/mipsel-installer.tar.gz';

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

const installBody = `
set -e
export PATH=/opt/sbin:/opt/bin:/opt/usr/sbin:/opt/usr/bin:$PATH
opkg remove nfqws-keenetic-web nfqws-keenetic 2>/dev/null || true
opkg update
opkg install ca-certificates wget-ssl
opkg remove wget-nossl 2>/dev/null || true
mkdir -p /opt/etc/opkg
echo "src/gz nfqws2-keenetic ${REPO}" > /opt/etc/opkg/nfqws2-keenetic.conf
opkg update
opkg install nfqws2-keenetic
opkg info nfqws2-keenetic | head -6
`;

async function trySsh(fn) {
  for (const port of [22, 222, Number(process.env.KEENETIC_ENTWARE_PORT ?? 0)].filter(Boolean)) {
    process.env.KEENETIC_ENTWARE_PORT = String(port);
    try {
      return await fn();
    } catch (e) {
      if (!/ECONNREFUSED|ETIMEDOUT|authentication/i.test(e.message)) throw e;
      console.log(`SSH :${port} — нет, пробуем дальше...`);
    }
  }
  return null;
}

async function entwareViaTelnet() {
  console.log('Entware через telnet (exec sh)...');
  const probe = await telnetExecSh('test -d /opt/etc && echo HAS_OPT || echo NO_OPT');
  if (!/HAS_OPT/.test(probe.stdout)) {
    console.log('Entware не найден — установка через CLI opkg disk...');
    await telnetCli([
      'opkg disk storage:/',
      `opkg disk storage:/ ${ENTWARE_INSTALLER}`,
    ]);
    console.log('Ожидание установки Entware (90 с)...');
    await new Promise((r) => setTimeout(r, 90000));
    const probe2 = await telnetExecSh('test -d /opt/etc && echo HAS_OPT || echo NO_OPT');
    if (!/HAS_OPT/.test(probe2.stdout)) {
      throw new Error('Entware не установился. Вручную: веб → OPKG → внутренняя память.');
    }
  }
  const r = await telnetExecSh(installBody, { timeoutMs: 600000 });
  return { stdout: r.stdout, via: 'telnet' };
}

async function uploadAndRestart(conn) {
  const iface = process.env.NFQWS_ISP_INTERFACE ?? 'eth3';
  let detected = iface;
  try {
    const r = await execEntware(conn, 'sh -c "route 2>/dev/null | grep ^default | head -1"');
    const parts = r.stdout.trim().split(/\s+/);
    if (parts.length) detected = parts[parts.length - 1];
  } catch { /* use default */ }

  await uploadNfqws2Config(conn, { ispInterface: detected });
  console.log(`Конфиг: ISP_INTERFACE=${detected}`);

  const rs = await nfqws2ServiceCmd(conn, 'restart');
  process.stdout.write(rs.stdout);
  const st = await nfqws2ServiceCmd(conn, 'status');
  console.log('\n' + st.stdout.trim());
}

console.log(`Keenetic ${keeneticEnv().host} — полная установка nfqws2\n`);

let result = await trySsh(async () => {
  const conn = await connectEntware();
  try {
    console.log(`SSH root@${entwareSshConfig().host}:${entwareSshConfig().port}`);
    const check = await execEntware(conn, 'sh -c "test -d /opt/etc && echo OK || echo NO"');
    if (!/OK/.test(check.stdout)) {
      throw new Error('ECONNREFUSED entware missing');
    }
    console.log('Установка nfqws2-keenetic...');
    const install = await execEntware(conn, `sh -c ${JSON.stringify(installBody)}`, { timeoutMs: 600000 });
    process.stdout.write(install.stdout);
    if (install.stderr) process.stderr.write(install.stderr);
    if (install.code !== 0) throw new Error(`opkg exit ${install.code}`);
    await uploadAndRestart(conn);
    return { via: 'ssh' };
  } finally {
    conn.end();
  }
});

if (!result) {
  result = await entwareViaTelnet();
  process.stdout.write(result.stdout);

  // upload config via telnet heredoc
  const confPath = join(root, 'deploy', 'keenetic', 'nfqws2', 'nfqws2.conf');
  let text = readFileSync(confPath, 'utf8');
  const iface = process.env.NFQWS_ISP_INTERFACE ?? 'eth3';
  text = text.replace(/^ISP_INTERFACE=".*"/m, `ISP_INTERFACE="${iface}"`);
  const escaped = text.replace(/\\/g, '\\\\').replace(/'/g, "'\\''");
  await telnetExecSh([
    `mkdir -p /opt/etc/nfqws2`,
    `cat > /opt/etc/nfqws2/nfqws2.conf <<'EOF'\n${text}\nEOF`,
    '/opt/etc/init.d/S51nfqws2 restart || /opt/etc/init.d/nfqws2-keenetic restart',
    '/opt/etc/init.d/S51nfqws2 status 2>/dev/null || /opt/etc/init.d/nfqws2-keenetic status',
  ].join('\n'), { timeoutMs: 120000 });
}

// final status via telnet
const status = await telnetExecSh(`
pgrep -af nfqws2 || echo no_process
iptables-save 2>/dev/null | grep nfqws | head -3 || true
grep '^ISP_INTERFACE=' /opt/etc/nfqws2/nfqws2.conf 2>/dev/null || true
`);
console.log('\n=== Итог ===');
console.log(status.stdout.split('__NFQWS_DONE__')[0].slice(-1500));
console.log('\nПолитику nfqws назначьте устройствам вручную в веб-интерфейсе.');
