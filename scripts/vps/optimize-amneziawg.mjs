/**
 * Ускорение AmneziaWG на VPS (MTU 1420, BBR).
 *
 *   npm run vps:amnezia:optimize
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const optimizeSh = join(dirname(fileURLToPath(import.meta.url)), 'optimize-amneziawg.sh');
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const localOutDir = join(root, 'artifacts', 'amnezia');

if (!existsSync(keyPath)) {
  console.error(`Нет SSH-ключа ${keyPath}`);
  process.exit(1);
}

function connect() {
  return new Promise((resolveConn, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolveConn(conn)).on('error', reject).connect({
      host,
      port: 22,
      username: process.env.VPS_USER ?? 'root',
      privateKey: readFileSync(keyPath),
    });
  });
}

function run(conn, command) {
  return new Promise((resolveRun, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => resolveRun(code ?? 0));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

function upload(conn, localPath, remotePath) {
  return new Promise((resolveUpload, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localPath, remotePath, (putErr) => {
        if (putErr) reject(putErr);
        else resolveUpload();
      });
    });
  });
}

function downloadDir(conn, remoteDir, localDir) {
  return new Promise((resolveDownload, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.readdir(remoteDir, (readErr, list) => {
        if (readErr) return reject(readErr);
        const files = list.filter((e) => /\.(conf|png)$/.test(e.filename));
        mkdirSync(localDir, { recursive: true });
        if (files.length === 0) return resolveDownload([]);
        let pending = files.length;
        const saved = [];
        for (const entry of files) {
          sftp.fastGet(`${remoteDir}/${entry.filename}`, join(localDir, entry.filename), (getErr) => {
            if (getErr) return reject(getErr);
            saved.push(join(localDir, entry.filename));
            if (--pending === 0) resolveDownload(saved);
          });
        }
      });
    });
  });
}

const conn = await connect();
console.log(`SSH ${host} — оптимизация скорости AmneziaWG...\n`);
await upload(conn, optimizeSh, '/tmp/optimize-amneziawg.sh');
const code = await run(
  conn,
  `chmod +x /tmp/optimize-amneziawg.sh && VPS_PUBLIC_IP=${host} bash /tmp/optimize-amneziawg.sh`,
);
let saved = [];
if (code === 0) saved = await downloadDir(conn, '/root/amnezia-clients', localOutDir);
conn.end();

if (saved.length) {
  writeFileSync(
    join(localOutDir, 'README.txt'),
    [
      'Обновлённые конфиги (MTU 1420, DNS Яндекс).',
      'Удалите старый туннель в AmneziaVPN и импортируйте amnezia-1.conf заново.',
      '',
      'Если всё ещё медленно — в AmneziaVPN отключите «Весь трафик через VPN»',
      'и оставьте только нужные сайты, либо смените тариф VPS на больший канал.',
    ].join('\n'),
    'utf8',
  );
  console.log('\nСкачано:', saved.join(', '));
}

process.exit(code === 0 ? 0 : 1);
