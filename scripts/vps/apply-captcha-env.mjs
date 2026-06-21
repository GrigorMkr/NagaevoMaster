/**
 * Применяет deploy/captcha.env на VPS и перезапускает API.
 *
 *   npm run vps:captcha
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const captchaPath = resolve(root, 'deploy/captcha.env');
const keyPath = join(homedir(), '.ssh', 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';

const KEYS = [
  'RECAPTCHA_SITE_KEY',
  'RECAPTCHA_SECRET_KEY',
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

const vars = loadEnv(captchaPath);
if (!vars) {
  console.error('Создайте deploy/captcha.env из deploy/captcha.env.example');
  process.exit(1);
}

if (!vars.RECAPTCHA_SITE_KEY || !vars.RECAPTCHA_SECRET_KEY) {
  console.error('Заполните RECAPTCHA_SITE_KEY и RECAPTCHA_SECRET_KEY');
  process.exit(1);
}

const mergeScript = `#!/bin/bash
set -euo pipefail
ENV_FILE=/var/www/nagaevomaster/backend/.env
CAPTCHA_FILE=/tmp/captcha-merge.env
touch "$ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \\#* ]] && continue
  key="\${line%%=*}"
  val="\${line#*=}"
  grep -v "^\${key}=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
  mv "$ENV_FILE.tmp" "$ENV_FILE"
  printf '%s=%s\\n' "$key" "$val" >> "$ENV_FILE"
done < "$CAPTCHA_FILE"
pm2 restart nagaevomaster-api --update-env
sleep 2
curl -fsS http://127.0.0.1:4000/api/health && echo ""
curl -fsS http://127.0.0.1:4000/api/auth/captcha-config && echo ""
echo "Captcha env applied."
`;

const captchaBody = KEYS.filter((k) => vars[k]).map((k) => `${k}=${vars[k]}`).join('\n') + '\n';

function upload(sftp, path, content, mode = 0o644) {
  return new Promise((resolve, reject) => {
    const ws = sftp.createWriteStream(path, { mode });
    ws.on('close', resolve);
    ws.on('error', reject);
    ws.end(content);
  });
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
            await upload(sftp, '/tmp/captcha-merge.env', captchaBody);
            await upload(sftp, '/tmp/apply-captcha.sh', mergeScript, 0o755);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
      await run(conn, 'bash /tmp/apply-captcha.sh');
      conn.end();
      console.log('\nГотово. Капча включится на странице входа.');
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
