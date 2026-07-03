/**
 * Оптимизация WireGuard на VPS + скачать обновлённые конфиги.
 *
 *   $env:VPS_HOST='213.176.95.209'
 *   npm run vps:wireguard:optimize
 */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const vpsDir = dirname(fileURLToPath(import.meta.url));
const script = join(vpsDir, 'optimize-wireguard.sh');
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '213.176.95.209';
const wgPort = process.env.WG_PORT ?? '51820';
const wgMtu = process.env.WG_MTU ?? '1320';
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

console.log(`SSH ${host} — оптимизация WireGuard...\n`);
const conn = await connect();
await upload(conn, script, '/tmp/optimize-wireguard.sh');
const code = await run(
  conn,
  `chmod +x /tmp/optimize-wireguard.sh && WG_PORT=${wgPort} WG_MTU=${wgMtu} VPS_PUBLIC_IP=${host} bash /tmp/optimize-wireguard.sh`,
);
if (code === 0) {
  const saved = await downloadDir(conn, '/root/wireguard-clients', localOutDir);
  console.log('\nСкачано:', saved.join(', '));
  console.log(`\nПереимпортируйте keenetic-router.conf (порт ${wgPort}, MTU ${wgMtu}).`);
}
conn.end();
process.exit(code);
