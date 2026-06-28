import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'ssh2';

const host = process.env.VPS_HOST ?? '161.104.18.17';
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const command = [
  'systemctl status nginx --no-pager -l | head -25',
  'nginx -t 2>&1',
  "ss -tlnp | grep -E ':80|:443|:4000' || true",
  'pm2 list',
  'curl -fsS http://127.0.0.1:4000/api/health || echo API_DOWN',
].join('; echo ---; ');

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

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => resolve(code ?? 0));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

const conn = await connect();
const code = await run(conn, command);
conn.end();
process.exit(code === 0 ? 0 : 1);
