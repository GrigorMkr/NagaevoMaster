/**
 * Полная переустановка WireGuard на VPS (новые ключи, порт 51820).
 *
 *   $env:VPS_HOST='213.176.95.209'
 *   npm run vps:wireguard:reinstall
 */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const vpsDir = dirname(fileURLToPath(import.meta.url));
const script = join(vpsDir, 'reinstall-wireguard.sh');
const safeUp = join(vpsDir, 'wireguard-safe-up.sh');
const safeDown = join(vpsDir, 'wireguard-safe-down.sh');
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '213.176.95.209';
const localOutDir = join(root, 'artifacts', 'wireguard');

function connect() {
  return new Promise((resolveConn, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolveConn(conn)).on('error', reject).connect({
      host, port: 22, username: process.env.VPS_USER ?? 'root',
      privateKey: readFileSync(keyPath),
      readyTimeout: 60000,
    });
  });
}

function run(conn, cmd) {
  return new Promise((res, rej) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return rej(err);
      stream.on('close', (c) => res(c ?? 0));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

function upload(conn, local, remote) {
  return new Promise((res, rej) => {
    conn.sftp((err, sftp) => {
      if (err) return rej(err);
      sftp.fastPut(local, remote, (e) => (e ? rej(e) : res()));
    });
  });
}

function downloadDir(conn, remoteDir, localDir) {
  return new Promise((res, rej) => {
    conn.sftp((err, sftp) => {
      if (err) return rej(err);
      sftp.readdir(remoteDir, (e, list) => {
        if (e) return rej(e);
        mkdirSync(localDir, { recursive: true });
        const files = list.filter((f) => /\.(conf|png)$/.test(f.filename));
        let n = files.length;
        if (!n) return res([]);
        const saved = [];
        for (const f of files) {
          sftp.fastGet(`${remoteDir}/${f.filename}`, join(localDir, f.filename), (ge) => {
            if (ge) return rej(ge);
            saved.push(f.filename);
            if (--n === 0) res(saved);
          });
        }
      });
    });
  });
}

if (!existsSync(keyPath)) {
  console.error(`Нет SSH-ключа ${keyPath}`);
  process.exit(1);
}

console.log(`SSH ${host} — переустановка WireGuard...\n`);
let conn;
try {
  conn = await connect();
} catch (e) {
  console.error(`\n❌ Сервер ${host} недоступен (${e.message}).`);
  console.error('Проверьте панель хостинга: сервер включён? SSH (22) и UDP 51820 открыты?');
  process.exit(1);
}

await upload(conn, script, '/tmp/reinstall-wireguard.sh');
await upload(conn, safeUp, '/tmp/wireguard-safe-up.sh');
await upload(conn, safeDown, '/tmp/wireguard-safe-down.sh');
const code = await run(
  conn,
  `chmod +x /tmp/reinstall-wireguard.sh /tmp/wireguard-safe-up.sh /tmp/wireguard-safe-down.sh && SCRIPT_DIR=/tmp VPS_PUBLIC_IP=${host} bash /tmp/reinstall-wireguard.sh`,
);
if (code === 0) {
  const saved = await downloadDir(conn, '/root/wireguard-clients', localOutDir);
  console.log('\nСкачано:', saved.join(', '));
  console.log('\nИмпорт:');
  console.log('  телефон/ПК  → client-1.conf');
  console.log('  Keenetic    → keenetic-router.conf');
}
conn.end();
process.exit(code);
