/**
 * Приватность AmneziaWG (DNS, без IPv6-утечки).
 *
 *   npm run vps:amnezia:privacy
 */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const script = join(dirname(fileURLToPath(import.meta.url)), 'privacy-amneziawg.sh');
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const localOutDir = join(root, 'artifacts', 'amnezia');

function connect() {
  return new Promise((resolveConn, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolveConn(conn)).on('error', reject).connect({
      host, port: 22, username: process.env.VPS_USER ?? 'root',
      privateKey: readFileSync(keyPath),
    });
  });
}

function run(conn, cmd) {
  return new Promise((resolveRun, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (c) => resolveRun(c ?? 0));
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
        if (!files.length) return res([]);
        let n = files.length;
        const saved = [];
        for (const f of files) {
          sftp.fastGet(`${remoteDir}/${f.filename}`, join(localDir, f.filename), (ge) => {
            if (ge) return rej(ge);
            saved.push(join(localDir, f.filename));
            if (--n === 0) res(saved);
          });
        }
      });
    });
  });
}

if (!existsSync(keyPath)) { console.error(`Нет ${keyPath}`); process.exit(1); }

const conn = await connect();
console.log(`SSH ${host} — приватность AmneziaWG...\n`);
await upload(conn, script, '/tmp/privacy-amneziawg.sh');
const code = await run(conn, `chmod +x /tmp/privacy-amneziawg.sh && VPS_PUBLIC_IP=${host} bash /tmp/privacy-amneziawg.sh`);
if (code === 0) await downloadDir(conn, '/root/amnezia-clients', localOutDir);
conn.end();
process.exit(code);
