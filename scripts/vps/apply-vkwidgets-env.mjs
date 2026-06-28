/**
 * Применяет deploy/vkwidgets.env на VPS и перезапускает API.
 *
 *   npm run vps:vkwidgets
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const widgetsPath = resolve(root, 'deploy/vkwidgets.env');
const keyPath = join(homedir(), '.ssh', 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';

const KEYS = [
  'VK_COMMUNITY_ID',
  'VK_VIDEO_URL',
  'VK_VIDEO_OID',
  'VK_VIDEO_ID',
  'VK_VIDEO_HASH',
  'VK_WALL_POST_OWNER_ID',
  'VK_WALL_POST_ID',
  'VK_WALL_POST_HASH',
  'VK_CONTACT_US_TEXT',
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

const vars = loadEnv(widgetsPath);
if (!vars) {
  console.error('Создайте deploy/vkwidgets.env: node scripts/setup-vkwidgets.mjs');
  process.exit(1);
}

const mergeScript = `#!/bin/bash
set -euo pipefail
ENV_FILE=/var/www/nagaevomaster/backend/.env
WIDGETS_FILE=/tmp/vkwidgets-merge.env
touch "$ENV_FILE"
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \\#* ]] && continue
  key="\${line%%=*}"
  val="\${line#*=}"
  grep -v "^\${key}=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
  mv "$ENV_FILE.tmp" "$ENV_FILE"
  printf '%s=%s\\n' "$key" "$val" >> "$ENV_FILE"
done < "$WIDGETS_FILE"
pm2 restart nagaevomaster-api --update-env
sleep 2
curl -fsS http://127.0.0.1:4000/api/health && echo ""
echo "VK widgets env applied."
`;

const body = KEYS.filter((k) => vars[k]).map((k) => `${k}=${vars[k]}`).join('\n') + '\n';

if (!body.trim()) {
  console.error('Заполните хотя бы VK_COMMUNITY_ID в deploy/vkwidgets.env');
  process.exit(1);
}

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
            await upload(sftp, '/tmp/vkwidgets-merge.env', body);
            await upload(sftp, '/tmp/apply-vkwidgets.sh', mergeScript, 0o755);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
      await run(conn, 'bash /tmp/apply-vkwidgets.sh');
      conn.end();
      console.log('\nVK виджеты: переменные на сервере. Проверьте /contact и /app');
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
