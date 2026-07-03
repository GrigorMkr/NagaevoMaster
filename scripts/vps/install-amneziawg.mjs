/**
 * AmneziaWG 2.0 на VPS (обфускация, совместимо с приложением AmneziaVPN).
 *
 *   npm run vps:amnezia
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const installSh = join(dirname(fileURLToPath(import.meta.url)), 'install-amneziawg.sh');
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const clients = process.env.AWG_CLIENTS ?? '2';
const localOutDir = join(root, 'artifacts', 'amnezia');

if (!existsSync(keyPath)) {
  console.error(`Нет SSH-ключа ${keyPath}`);
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

function downloadDir(conn, remoteDir, localDir, pattern = /\.(conf|png)$/) {
  return new Promise((resolveDownload, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.readdir(remoteDir, (readErr, list) => {
        if (readErr) return reject(readErr);
        const files = list.filter((e) => pattern.test(e.filename));
        if (files.length === 0) {
          resolveDownload([]);
          return;
        }
        mkdirSync(localDir, { recursive: true });
        let pending = files.length;
        const saved = [];
        for (const entry of files) {
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
console.log(`SSH ${host} — AmneziaWG 2.0 (клиентов: ${clients})\n`);
console.log('API и сайт не останавливаются. Старый WireGuard (wg0) будет отключён.\n');

await upload(conn, installSh, '/tmp/install-amneziawg.sh');
const code = await run(
  conn,
  `chmod +x /tmp/install-amneziawg.sh && AWG_CLIENTS=${clients} AWG_PORT=443 VPS_PUBLIC_IP=${host} bash /tmp/install-amneziawg.sh`,
);

let saved = [];
if (code === 0) {
  saved = await downloadDir(conn, '/root/amnezia-clients', localOutDir);
}
conn.end();

mkdirSync(localOutDir, { recursive: true });
writeFileSync(
  join(localOutDir, 'README.txt'),
  [
    'AmneziaWG — конфиги для приложения AmneziaVPN (не коммитить!).',
    '',
    'Способ 1 — импорт файла:',
    '  AmneziaVPN → + → «Импорт» / «Добавить конфигурацию» → amnezia-1.conf',
    '',
    'Способ 2 — QR:',
    '  AmneziaVPN → + → Сканировать QR → amnezia-1.png (открыть на ПК)',
    '',
    'Способ 3 — свой сервер (если импорт не сработал):',
    '  AmneziaVPN → + → Свой VPN-сервер → IP 161.104.18.17, SSH root, ключ',
    '  Протокол: AmneziaWG, порт 443',
    '',
    `Endpoint: ${host}:443`,
    '',
    'Удалите старый туннель WireGuard в приложении WireGuard (не Amnezia).',
  ].join('\n'),
  'utf8',
);

console.log('\n--- Локальные файлы ---');
for (const f of saved) console.log(`  ${f}`);
console.log(`\nИнструкция: ${join(localOutDir, 'README.txt')}`);

process.exit(code === 0 ? 0 : 1);
