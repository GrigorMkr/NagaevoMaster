/**
 * Пошаговая настройка OAuth: открывает консоли Google/VK и сохраняет ключи.
 *
 *   npm run oauth:setup
 *
 * После ввода ключей автоматически: deploy/oauth.env → npm run vps:oauth
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const oauthPath = resolve(root, 'deploy/oauth.env');
const SITE_URL = 'https://nagaevomaster.ru';
const GOOGLE_CALLBACK = `${SITE_URL}/api/auth/google/callback`;
const VK_CALLBACK = `${SITE_URL}/api/auth/vk/callback`;

const LINKS = {
  googleProject: 'https://console.cloud.google.com/projectcreate',
  googleCredentials: 'https://console.cloud.google.com/apis/credentials',
  googleConsent: 'https://console.cloud.google.com/apis/credentials/consent',
  vkApps: 'https://vk.com/apps?act=manage',
};

function openUrl(url) {
  try {
    if (process.platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore', shell: true });
    } else if (process.platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
  } catch {
    console.log(`  → ${url}`);
  }
}

function loadExisting() {
  if (!existsSync(oauthPath)) return {};
  const vars = {};
  for (const line of readFileSync(oauthPath, 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    vars[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return vars;
}

function printGuide() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  OAuth для nagaevomaster.ru — ~10 минут, нужен ваш аккаунт   ║
╚══════════════════════════════════════════════════════════════╝

Я не могу войти в Google/VK за вас — ключи выдают только эти сервисы.
Ниже пошагово; ссылки откроются в браузере.

── Google (5 мин) ──────────────────────────────────────────────
1. Создайте проект (если нет)
2. OAuth consent screen → External → заполните название «Нагаево Мастер»
3. Credentials → Create credentials → OAuth client ID → Web application
4. Authorized redirect URIs — скопируйте ТОЧНО:
   ${GOOGLE_CALLBACK}
5. Скопируйте Client ID и Client secret

── ВКонтакте (5 мин) ───────────────────────────────────────────
1. Мои приложения → Создать → тип «Веб-сайт» (или Standalone)
2. Адрес сайта: ${SITE_URL}
3. Redirect URI — скопируйте ТОЧНО:
   ${VK_CALLBACK}
4. Настройки → ID приложения = VK_CLIENT_ID
5. Защищённый ключ = VK_CLIENT_SECRET

`);
}

async function ask(rl, label, current) {
  const hint = current ? ` [Enter = оставить]` : '';
  const answer = (await rl.question(`${label}${hint}: `)).trim();
  return answer || current || '';
}

async function main() {
  printGuide();

  console.log('Открываю консоли в браузере…\n');
  openUrl(LINKS.googleConsent);
  openUrl(LINKS.googleCredentials);
  openUrl(LINKS.vkApps);

  const existing = loadExisting();
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('\nВставьте ключи (можно пропустить Google или VK, нажав Enter на пустом поле):\n');

  const googleId = await ask(rl, 'GOOGLE_CLIENT_ID', existing.GOOGLE_CLIENT_ID);
  const googleSecret = googleId
    ? await ask(rl, 'GOOGLE_CLIENT_SECRET', existing.GOOGLE_CLIENT_SECRET)
    : '';
  const vkId = await ask(rl, 'VK_CLIENT_ID', existing.VK_CLIENT_ID);
  const vkSecret = vkId ? await ask(rl, 'VK_CLIENT_SECRET', existing.VK_CLIENT_SECRET) : '';

  rl.close();

  if (!googleId && !vkId) {
    console.error('\nНужен хотя бы один провайдер (Google или VK). Запустите снова: npm run oauth:setup');
    process.exit(1);
  }

  const body = [
    `SITE_URL=${SITE_URL}`,
    `GOOGLE_CLIENT_ID=${googleId}`,
    `GOOGLE_CLIENT_SECRET=${googleSecret}`,
    `VK_CLIENT_ID=${vkId}`,
    `VK_CLIENT_SECRET=${vkSecret}`,
    '',
  ].join('\n');

  writeFileSync(oauthPath, body, 'utf8');
  console.log(`\n✓ Сохранено: deploy/oauth.env`);

  const deploy = process.argv.includes('--no-deploy')
    ? false
    : (await new Promise((resolve) => {
        const r = createInterface({ input: process.stdin, output: process.stdout });
        r.question('Применить на VPS сейчас? (Y/n): ').then((a) => {
          r.close();
          resolve(!a || /^y/i.test(a));
        });
      }));

  if (deploy) {
    console.log('\nДеплой на VPS…');
    execSync('node scripts/vps/apply-oauth-env.mjs', { cwd: root, stdio: 'inherit' });
    console.log('\nГотово! Проверьте: https://nagaevomaster.ru/auth');
  } else {
    console.log('\nЛокально: npm run vps:oauth');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
