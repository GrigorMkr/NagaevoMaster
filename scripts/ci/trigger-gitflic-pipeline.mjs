/**
 * Запуск пайплайна GitFlic на ветке main.
 *   npm run gitflic:pipeline
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { GitFlicApi } from './gitflic-api.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function loadToken() {
  const file = path.join(root, 'deploy', 'gitflic.env');
  if (!existsSync(file)) {
    throw new Error('deploy/gitflic.env не найден');
  }
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('GITFLIC_TOKEN=')) {
      return trimmed.slice('GITFLIC_TOKEN='.length).trim();
    }
  }
  throw new Error('GITFLIC_TOKEN не задан');
}

const token = process.env.GITFLIC_TOKEN || loadToken();
const owner = process.env.GITFLIC_OWNER || 'impherion';
const project = process.env.GITFLIC_PROJECT || 'nagaevo-master';
const api = new GitFlicApi(token);

const result = await api.post(`/project/${owner}/${project}/cicd/pipeline/start`, {
  refName: 'main',
  isTag: false,
});

if (!result.ok) {
  console.error('Не удалось запустить пайплайн:', result.status, result.data);
  process.exit(1);
}

console.log('Пайплайн запущен:', result.data);
