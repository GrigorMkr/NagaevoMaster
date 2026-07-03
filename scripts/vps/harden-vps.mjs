/**
 * Усиление безопасности VPS + подготовка WireGuard к UDP 443.
 *
 *   npm run vps:harden
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const hardenSh = join(dirname(fileURLToPath(import.meta.url)), 'harden-vps.sh');
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const wgPort = process.env.WG_PORT ?? '443';

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

const conn = await connect();
console.log(`SSH ${host} — hardening VPS (WireGuard UDP ${wgPort})...\n`);
await upload(conn, hardenSh, '/tmp/harden-vps.sh');
const code = await run(
  conn,
  `chmod +x /tmp/harden-vps.sh && WG_PORT=${wgPort} bash /tmp/harden-vps.sh`,
);
conn.end();
process.exit(code === 0 ? 0 : 1);
