/**
 * Создаёт deploy/vkwidgets.env из deploy/oauth.env (VK_CLIENT_ID → VK_WIDGETS_API_ID).
 *
 *   node scripts/setup-vkwidgets.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const oauthPath = path.join(root, 'deploy', 'oauth.env');
const widgetsPath = path.join(root, 'deploy', 'vkwidgets.env');

function loadEnv(filePath) {
  const vars = {};
  if (!existsSync(filePath)) {
    return vars;
  }
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const oauth = loadEnv(oauthPath);
const existing = loadEnv(widgetsPath);

const apiId = existing.VK_WIDGETS_API_ID || oauth.VK_CLIENT_ID || '';
const lines = [
  '# Сгенерировано scripts/setup-vkwidgets.mjs',
  '# Заполните VK_COMMUNITY_ID и VK_VIDEO_URL, затем: npm run vps:vkwidgets',
  '',
  `VK_WIDGETS_API_ID=${apiId}`,
  `VK_COMMUNITY_ID=${existing.VK_COMMUNITY_ID || ''}`,
  `VK_CONTACT_US_TEXT=${existing.VK_CONTACT_US_TEXT || 'Напишите нам'}`,
  '',
  '# Ссылка на видео из RuStore / VK',
  `VK_VIDEO_URL=${existing.VK_VIDEO_URL || ''}`,
  '',
  '# Запись на стене (экспорт из VK)',
  `VK_WALL_POST_OWNER_ID=${existing.VK_WALL_POST_OWNER_ID || ''}`,
  `VK_WALL_POST_ID=${existing.VK_WALL_POST_ID || ''}`,
  `VK_WALL_POST_HASH=${existing.VK_WALL_POST_HASH || ''}`,
  '',
];

writeFileSync(widgetsPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`Создан ${path.relative(root, widgetsPath)}`);
if (!existing.VK_COMMUNITY_ID) {
  console.log('⚠ Укажите VK_COMMUNITY_ID (отрицательный ID группы) для виджетов на /contact');
}
