/**
 * Деплой API на VPS из локального репозитория (без git push).
 *
 *   npm run vps:deploy
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'ssh2';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const privateKeyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');
const host = process.env.VPS_HOST ?? '161.104.18.17';
const user = process.env.VPS_USER ?? 'root';
const appDir = process.env.VPS_APP_DIR ?? '/var/www/nagaevomaster';
const archivePath = join(tmpdir(), 'nagaevomaster-deploy.tar.gz');
const remoteArchive = '/tmp/nagaevomaster-deploy.tar.gz';

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

console.log('Создаём архив для деплоя (рабочая копия)...');
const tarExcludes = [
  '--exclude=backend/node_modules',
  '--exclude=backend/dist',
  '--exclude=backend/uploads',
  '--exclude=backend/.env',
].join(' ');
execSync(`tar -czf "${archivePath}" ${tarExcludes} backend scripts package.json package-lock.json`, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

const conn = await connect();
console.log(`SSH ${host} — загрузка и деплой API...\n`);

try {
  await upload(conn, archivePath, remoteArchive);
  const code = await run(
    conn,
    [
      `mkdir -p ${appDir}`,
      `tar -xzf ${remoteArchive} -C ${appDir}`,
      `rm -f ${remoteArchive}`,
      `find ${appDir}/scripts -name '*.sh' -exec sed -i 's/\\r$//' {} +`,
      `cd ${appDir} && bash scripts/vps/deploy-api.sh`,
    ].join(' && '),
  );
  conn.end();
  unlinkSync(archivePath);
  process.exit(code === 0 ? 0 : 1);
} catch (error) {
  conn.end();
  if (existsSync(archivePath)) unlinkSync(archivePath);
  console.error(error);
  process.exit(1);
}
