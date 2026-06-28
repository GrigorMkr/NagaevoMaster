/**
 * git push в GitFlic с токеном из deploy/gitflic.env (не попадает в argv).
 *   npm run gitflic:push
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(root, 'deploy', 'gitflic.env');

function loadEnv() {
  if (!existsSync(envPath)) {
    throw new Error('Создайте deploy/gitflic.env из deploy/gitflic.env.example');
  }
  const vars = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const cfg = loadEnv();
const token = cfg.GITFLIC_TOKEN;
const owner = cfg.GITFLIC_OWNER || 'nagaevomaster';
const project = cfg.GITFLIC_PROJECT || 'nagaevo-master';
const branch = process.argv[2] || 'main';

if (!token) {
  console.error('GITFLIC_TOKEN пуст в deploy/gitflic.env');
  process.exit(1);
}

const pushUrl = `https://${encodeURIComponent(owner)}:${encodeURIComponent(token)}@gitflic.ru/project/${owner}/${project}.git`;
console.log(`GitFlic push: ${owner}/${project} → ${branch}`);

const result = spawnSync('git', ['push', pushUrl, `${branch}:${branch}`], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
});

process.exit(result.status ?? 1);
