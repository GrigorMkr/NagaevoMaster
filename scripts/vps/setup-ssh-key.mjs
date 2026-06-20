/**
 * Копирует локальный SSH-ключ на VPS (один раз, по паролю root).
 *
 *   set VPS_PASSWORD=...   (Windows)
 *   $env:VPS_PASSWORD='...' (PowerShell)
 *   node scripts/vps/setup-ssh-key.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'ssh2';

const host = process.env.VPS_HOST ?? '161.104.18.17';
const user = process.env.VPS_USER ?? 'root';
const password = process.env.VPS_PASSWORD;
const keyName = process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps';
const sshDir = join(homedir(), '.ssh');
const privateKeyPath = join(sshDir, keyName);
const publicKeyPath = `${privateKeyPath}.pub`;
const configPath = join(sshDir, 'config');
const configHost = process.env.VPS_SSH_CONFIG_HOST ?? 'nagaevomaster-vps';

if (!existsSync(publicKeyPath)) {
  console.error(`Нет ключа ${publicKeyPath}. Сначала: ssh-keygen -t ed25519 -f ~/.ssh/${keyName}`);
  process.exit(1);
}

if (!password) {
  console.error('Укажите VPS_PASSWORD (одноразово, для копирования ключа).');
  process.exit(1);
}

const pubKey = readFileSync(publicKeyPath, 'utf8').trim();

function run(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => {
        out += d;
      });
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(out || `exit ${code}`));
        else resolve(out);
      });
    });
  });
}

function sftpRead(sftp, path) {
  return new Promise((resolve, reject) => {
    sftp.readFile(path, (err, data) => {
      if (err && err.code === 2) resolve('');
      else if (err) reject(err);
      else resolve(data.toString());
    });
  });
}

function sftpWrite(sftp, path, content, mode) {
  return new Promise((resolve, reject) => {
    sftp.writeFile(path, content, { mode }, (err) => (err ? reject(err) : resolve()));
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      await run(conn, 'mkdir -p ~/.ssh && chmod 700 ~/.ssh');

      await new Promise((resolve, reject) => {
        conn.sftp(async (err, sftp) => {
          if (err) return reject(err);
          try {
            const authPath = '/root/.ssh/authorized_keys';
            let keys = await sftpRead(sftp, authPath);
            if (!keys.split('\n').some((line) => line.trim() === pubKey)) {
              keys = keys.trimEnd() + (keys ? '\n' : '') + pubKey + '\n';
              await sftpWrite(sftp, authPath, keys, 0o600);
              console.log('Публичный ключ добавлен на VPS.');
            } else {
              console.log('Ключ уже был на VPS.');
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

      mkdirSync(sshDir, { recursive: true });

      const knownHostsPath = join(sshDir, 'known_hosts');
      const { execSync } = await import('node:child_process');
      try {
        const scanned = execSync(`ssh-keyscan -H ${host} 2>/dev/null`, {
          encoding: 'utf8',
          shell: true,
        });
        if (scanned.trim()) {
          const existing = existsSync(knownHostsPath) ? readFileSync(knownHostsPath, 'utf8') : '';
          if (!existing.includes(host)) {
            writeFileSync(knownHostsPath, existing.trimEnd() + '\n' + scanned, 'utf8');
            console.log('Хост добавлен в known_hosts.');
          }
        }
      } catch {
        console.warn('ssh-keyscan недоступен — при первом ssh подтвердите fingerprint вручную.');
      }

      const block = [
        '',
        `Host ${configHost}`,
        `  HostName ${host}`,
        `  User ${user}`,
        `  IdentityFile ~/.ssh/${keyName}`,
        `  IdentitiesOnly yes`,
        '',
      ].join('\n');

      let config = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
      if (!config.includes(`Host ${configHost}`)) {
        writeFileSync(configPath, config.trimEnd() + block, 'utf8');
        console.log(`Запись добавлена в ${configPath} → Host ${configHost}`);
      } else {
        console.log(`Host ${configHost} уже есть в ${configPath}`);
      }

      conn.end();

      const test = new Client();
      test
        .on('ready', () => {
          test.exec('echo ok', (e, s) => {
            s.on('data', (d) => process.stdout.write(d));
            s.on('close', () => {
              test.end();
              console.log(`\nГотово. Подключение: ssh ${configHost}`);
              process.exit(0);
            });
          });
        })
        .on('error', (e) => {
          console.error('Проверка по ключу не удалась:', e.message);
          process.exit(1);
        })
        .connect({
          host,
          port: 22,
          username: user,
          privateKey: readFileSync(privateKeyPath),
        });
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
  .connect({ host, port: 22, username: user, password, readyTimeout: 30000 });
