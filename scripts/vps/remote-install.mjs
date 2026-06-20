import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const configHost = process.env.VPS_SSH_CONFIG_HOST ?? 'nagaevomaster-vps';
const keyName = process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps';
const privateKeyPath = join(homedir(), '.ssh', keyName);
const host = process.env.VPS_HOST ?? '161.104.18.17';
const user = process.env.VPS_USER ?? 'root';

if (!existsSync(privateKeyPath)) {
  console.error(`Нет ${privateKeyPath}. Запустите: node scripts/vps/setup-ssh-key.mjs`);
  process.exit(1);
}

const installSh = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'bootstrap-vps.sh'),
  'utf8',
);

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
console.log(`SSH ${configHost} — установка API...\n`);

await new Promise((resolve, reject) => {
  conn.sftp((err, sftp) => {
    if (err) return reject(err);
    const ws = sftp.createWriteStream('/tmp/bootstrap-vps.sh', { mode: 0o755 });
    ws.on('close', resolve);
    ws.on('error', reject);
    ws.end(installSh);
  });
});

const code = await run(
  conn,
  [
    'export DEBIAN_FRONTEND=noninteractive UCF_FORCE_CONFOLD=1 NEEDRESTART_MODE=a',
    'killall apt apt-get dpkg 2>/dev/null || true',
    'rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock',
    'dpkg --force-confdef --force-confold --configure -a || true',
    'apt-get -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold -f install -y || true',
    'bash /tmp/bootstrap-vps.sh',
  ].join(' && '),
);

conn.end();
process.exit(code);
