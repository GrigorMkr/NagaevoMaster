/**
 * Деплой API на VPS: git pull + deploy-api.sh
 *
 *   npm run vps:deploy
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'ssh2';

const privateKeyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const user = process.env.VPS_USER ?? 'root';
const appDir = process.env.VPS_APP_DIR ?? '/var/www/nagaevomaster';

if (!existsSync(privateKeyPath)) {
  console.error(`Нет ${privateKeyPath}. Запустите: npm run vps:ssh-setup`);
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
        username: user,
        privateKey: readFileSync(privateKeyPath),
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

const conn = await connect();
console.log(`SSH ${host} — деплой API...\n`);

const command = [
  `cd ${appDir}`,
  'git fetch origin main',
  'git reset --hard origin/main',
  'bash scripts/vps/deploy-api.sh',
].join(' && ');

const code = await run(conn, command);
conn.end();
process.exit(code === 0 ? 0 : 1);
