/**
 * Установка личного WireGuard на VPS (рядом с API, без остановки сайта).
 *
 *   npm run vps:wireguard
 *   WG_CLIENTS=3 npm run vps:wireguard
 */
import { readFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const installSh = join(dirname(fileURLToPath(import.meta.url)), 'install-wireguard.sh');
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const clients = process.env.WG_CLIENTS ?? '2';
const localOutDir = join(root, 'artifacts', 'wireguard');

if (!existsSync(keyPath)) {
  console.error(`Нет SSH-ключа ${keyPath}. Запустите: npm run vps:ssh-setup`);
  process.exit(1);
}

function connect() {
  return new Promise((resolveConn, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => resolveConn(conn))
      .on('error', reject)
      .connect({
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
        const confFiles = list.filter((entry) => entry.filename.endsWith('.conf'));
        if (confFiles.length === 0) {
          resolveDownload([]);
          return;
        }
        mkdirSync(localDir, { recursive: true });
        let pending = confFiles.length;
        const saved = [];
        for (const entry of confFiles) {
          const remotePath = `${remoteDir}/${entry.filename}`;
          const localPath = join(localDir, entry.filename);
          sftp.fastGet(remotePath, localPath, (getErr) => {
            if (getErr) return reject(getErr);
            saved.push(localPath);
            pending -= 1;
            if (pending === 0) resolveDownload(saved);
          });
        }
      });
    });
  });
}

const conn = await connect();
console.log(`SSH ${host} — установка WireGuard (клиентов: ${clients})...\n`);
console.log('API и сайт продолжают работать — WireGuard на UDP 443 (HTTPS на 443 TCP не затрагивается).\n');

await upload(conn, installSh, '/tmp/install-wireguard.sh');
const code = await run(
  conn,
  `chmod +x /tmp/install-wireguard.sh && WG_CLIENTS=${clients} VPS_PUBLIC_IP=${host} bash /tmp/install-wireguard.sh`,
);

if (code !== 0) {
  conn.end();
  process.exit(code);
}

const saved = await downloadDir(conn, '/root/wireguard-clients', localOutDir);
conn.end();

console.log('\n--- Локальные копии конфигов (не коммитить!) ---');
for (const file of saved) {
  console.log(`  ${file}`);
}

const readme = join(localOutDir, 'README.txt');
writeFileSync(
  readme,
  [
    'WireGuard — личные конфиги (секретные ключи!).',
    'Не публикуйте и не коммитьте в git.',
    '',
    'Windows: WireGuard → Импорт туннеля из файла → client-1.conf',
    'Android/iOS: WireGuard → + → Сканировать QR или импорт файла',
    '',
    `Endpoint: ${host}:443`,
    '',
    'QR на сервере: qrencode -t ansiutf8 < /root/wireguard-clients/client-1.conf',
  ].join('\n'),
  'utf8',
);

console.log(`\nИнструкция: ${readme}`);
console.log('\nПроверьте: https://nagaevomaster.ru и https://api.nagaevomaster.ru/api/health');
