/**
 * Показать публичный SSH-ключ для вставки в Aeza.
 *
 *   npm run vps:aeza:ssh-pubkey
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const keyName = process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps';
const pubPath = join(homedir(), '.ssh', `${keyName}.pub`);
const privPath = join(homedir(), '.ssh', keyName);

let pub = '';
if (existsSync(pubPath)) {
  pub = readFileSync(pubPath, 'utf8').trim();
} else if (existsSync(privPath)) {
  const r = spawnSync('ssh-keygen', ['-y', '-f', privPath], { encoding: 'utf8' });
  pub = (r.stdout ?? '').trim();
}

if (!pub) {
  console.error(`Нет ключа ~/.ssh/${keyName}.pub`);
  console.error(`Создайте: ssh-keygen -t ed25519 -f ~/.ssh/${keyName}`);
  process.exit(1);
}

console.log('Скопируйте в Aeza → SSH-ключи → Содержимое:\n');
console.log(pub);
console.log('\nИмя ключа: nagaevo (или «Рабочий компьютер»)');
console.log('✅ «Автоматически добавлять на серверы»');
