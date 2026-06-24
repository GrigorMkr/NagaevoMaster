/**
 * Применяет deploy/push.env и firebase-service-account.json на VPS.
 *
 *   npm run fcm:setup
 *   npm run vps:push
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pushPath = resolve(root, 'deploy/push.env');
const serviceAccountPath = resolve(root, 'deploy/firebase-service-account.json');
const keyPath = join(homedir(), '.ssh', 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const remoteServiceAccountPath = '/var/www/nagaevomaster/backend/firebase-service-account.json';

const KEYS = [
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'FCM_SERVER_KEY',
  'FCM_PROJECT_ID',
  'FCM_SERVICE_ACCOUNT_PATH',
  'GOOGLE_APPLICATION_CREDENTIALS',
];

function loadEnv(file) {
  if (!existsSync(file)) return null;
  const vars = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    vars[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return vars;
}

const vars = loadEnv(pushPath);
if (!vars) {
  console.error('Создайте deploy/push.env из deploy/push.env.example');
  process.exit(1);
}

if (!vars.VAPID_PUBLIC_KEY || !vars.VAPID_PRIVATE_KEY) {
  console.error('Заполните VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY (npm run vapid:generate)');
  process.exit(1);
}

if (existsSync(serviceAccountPath)) {
  vars.FCM_SERVICE_ACCOUNT_PATH = remoteServiceAccountPath;
  vars.GOOGLE_APPLICATION_CREDENTIALS = remoteServiceAccountPath;
}

const mergeScript = `#!/bin/bash
set -euo pipefail
ENV_FILE=/var/www/nagaevomaster/backend/.env
PUSH_FILE=/tmp/push-merge.env
touch "$ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \\#* ]] && continue
  key="\${line%%=*}"
  val="\${line#*=}"
  grep -v "^\${key}=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
  mv "$ENV_FILE.tmp" "$ENV_FILE"
  printf '%s=%s\\n' "$key" "$val" >> "$ENV_FILE"
done < "$PUSH_FILE"
chmod 600 /var/www/nagaevomaster/backend/firebase-service-account.json 2>/dev/null || true
pm2 restart nagaevomaster-api --update-env
sleep 2
curl -fsS http://127.0.0.1:4000/api/health && echo ""
curl -fsS http://127.0.0.1:4000/api/push/vapid-public-key && echo ""
echo "Push env applied."
`;

const pushBody = KEYS.filter((k) => vars[k]).map((k) => `${k}=${vars[k]}`).join('\n') + '\n';

function upload(sftp, path, content, mode = 0o644) {
  return new Promise((resolve, reject) => {
    const ws = sftp.createWriteStream(path, { mode });
    ws.on('close', resolve);
    ws.on('error', reject);
    ws.end(content);
  });
}

function uploadFile(sftp, localPath, remotePath, mode = 0o600) {
  const content = readFileSync(localPath);
  return upload(sftp, remotePath, content, mode);
}

function run(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      await new Promise((resolve, reject) => {
        conn.sftp(async (err, sftp) => {
          if (err) return reject(err);
          try {
            await upload(sftp, '/tmp/push-merge.env', pushBody);
            await upload(sftp, '/tmp/apply-push.sh', mergeScript, 0o755);
            if (existsSync(serviceAccountPath)) {
              await uploadFile(sftp, serviceAccountPath, remoteServiceAccountPath, 0o600);
              console.log(`Загружен: ${remoteServiceAccountPath}`);
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
      await run(conn, 'bash /tmp/apply-push.sh');
      conn.end();
      console.log('\nГотово. Push-уведомления настроены на VPS.');
    } catch (e) {
      console.error(e);
      conn.end();
      process.exit(1);
    }
  })
  .on('error', (e) => {
    console.error('SSH:', e.message);
    process.exit(1);
  })
  .connect({
    host,
    port: 22,
    username: 'root',
    privateKey: readFileSync(keyPath),
  });
