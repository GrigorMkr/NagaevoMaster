/**
 * Быстрое восстановление nginx на VPS (SSL + reload).
 *
 *   npm run vps:nginx
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const nginxExample = join(root, 'deploy/nginx-api.conf.example');
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const appDir = process.env.VPS_APP_DIR ?? '/var/www/nagaevomaster';

if (!existsSync(keyPath)) {
  console.error(`Нет ${keyPath}`);
  process.exit(1);
}

function connect() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => resolve(conn))
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
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => resolve(code ?? 0));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

function upload(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localPath, remotePath, (putErr) => {
        if (putErr) reject(putErr);
        else resolve();
      });
    });
  });
}

const conn = await connect();
const remotePath = '/etc/nginx/sites-available/nagaevomaster-api';
console.log(`SSH ${host} — обновление nginx (HTTPS)...\n`);
await upload(conn, nginxExample, remotePath);
const code = await run(
  conn,
  [
    `nginx -t`,
    `systemctl reload nginx`,
    `ss -tlnp | grep -E ':80|:443' || true`,
    `curl -fsS https://api.nagaevomaster.ru/api/health`,
    `echo`,
  ].join(' && '),
);
conn.end();
process.exit(code === 0 ? 0 : 1);
