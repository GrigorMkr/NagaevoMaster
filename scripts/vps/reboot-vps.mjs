/**
 * Перезагрузка VPS (после обновления ядра / DKMS).
 *
 *   npm run vps:reboot
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'ssh2';

const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';

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

function waitForSsh(maxMs = 120_000) {
  const start = Date.now();
  return new Promise((resolveWait, reject) => {
    const attempt = () => {
      const conn = new Client();
      conn
        .on('ready', () => {
          conn.end();
          resolveWait();
        })
        .on('error', () => {
          conn.end();
          if (Date.now() - start > maxMs) {
            reject(new Error('SSH не ответил после перезагрузки'));
            return;
          }
          setTimeout(attempt, 5000);
        })
        .connect({
          host,
          port: 22,
          username: process.env.VPS_USER ?? 'root',
          privateKey: readFileSync(keyPath),
          readyTimeout: 8000,
        });
    };
    attempt();
  });
}

const conn = await connect();
console.log(`SSH ${host} — перезагрузка (API ~1–2 мин недоступен)...\n`);
await run(conn, 'nohup reboot >/dev/null 2>&1 &');
conn.end();

console.log('Ожидание SSH...');
await waitForSsh();
console.log('VPS снова online.');
const check = await connect();
const code = await run(check, 'uname -r && curl -fsS http://127.0.0.1:4000/api/health && echo');
check.end();
process.exit(code === 0 ? 0 : 1);
