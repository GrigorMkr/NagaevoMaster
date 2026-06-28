/**
 * Проверка GitFlic CI/CD без вывода секретов.
 *   node scripts/ci/verify-gitflic.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitFlicApi } from './gitflic-api.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function loadGitflicEnv() {
  const file = path.join(root, 'deploy', 'gitflic.env');
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function loadEnvKeys(rel) {
  if (!existsSync(path.join(root, rel))) return [];
  const keys = [];
  for (const line of readFileSync(path.join(root, rel), 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (value) keys.push(key);
  }
  return keys;
}

const cfg = loadGitflicEnv();
const owner = process.env.GITFLIC_OWNER || cfg.GITFLIC_OWNER || 'nagaevomaster';
const project = process.env.GITFLIC_PROJECT || cfg.GITFLIC_PROJECT || 'nagaevo-master';
const company = process.env.GITFLIC_COMPANY || cfg.GITFLIC_COMPANY || 'nagaevomaster';
const token = process.env.GITFLIC_TOKEN || cfg.GITFLIC_TOKEN;

const required = [
  'ANDROID_KEYSTORE_BASE64',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'GOOGLE_SERVICES_JSON',
];
const optional = ['VK_MAPS_API_KEY', 'RS_KEY_ID', 'RS_PRIVATE_KEY'];

console.log('=== Локальные файлы ===');
console.log(`deploy/rustore.env: ${existsSync(path.join(root, 'deploy', 'rustore.env')) ? 'есть' : 'нет'}`);
if (existsSync(path.join(root, 'deploy', 'rustore.env'))) {
  const rustoreKeys = loadEnvKeys('deploy/rustore.env');
  console.log(`  ключи: ${rustoreKeys.join(', ') || '(пусто)'}`);
}

const api = new GitFlicApi(token);

console.log('\n=== GitFlic CI/CD переменные ===');
const vars = await api.get(`/project/${owner}/${project}/setting/cicd/variable`);
if (!vars.ok) {
  console.log(`Ошибка API: ${vars.status}`);
  process.exit(1);
}

const list = vars.data?._embedded?.restPipelineJobVariableModelList ?? [];
const have = new Set(list.map((v) => v.key));
console.log(`В проекте: ${list.length} переменных`);

for (const key of required) {
  console.log(`  ${key}: ${have.has(key) ? 'OK' : 'ОТСУТСТВУЕТ'}`);
}
for (const key of optional) {
  console.log(`  ${key}: ${have.has(key) ? 'OK' : 'нет (опционально)'}`);
}

console.log('\n=== Runner ===');
const runners = await api.get(`/company/${company}/runners`);
const runnerList = runners.data?._embedded?.restPipelineRunnerModelList ?? [];
if (runnerList.length === 0) {
  console.log('Агенты не найдены');
} else {
  for (const r of runnerList) {
    console.log(`  ${r.name}: active=${r.active}, platform=${r.platform}`);
  }
}

console.log('\n=== Последний пайплайн ===');
const pipes = await api.get(`/project/${owner}/${project}/cicd/pipeline?page=0&size=1`);
const latest = pipes.data?._embedded?.restPipelineModelList?.[0];
if (!latest) {
  console.log('Пайплайнов нет');
} else {
  const jobs = await api.get(`/project/${owner}/${project}/cicd/pipeline/${latest.localId}/jobs`);
  const jobList = jobs.data?._embedded?.restPipelineJobModelList ?? [];
  console.log(`Pipeline #${latest.localId}: ${latest.status} (ref: ${latest.ref})`);
  for (const j of jobList.sort((a, b) => a.localId - b.localId)) {
    console.log(`  ${j.name}: ${j.status}`);
  }
}

const missingRequired = required.filter((k) => !have.has(k));
if (missingRequired.length === 0) {
  console.log('\n✓ Обязательные CI/CD переменные на месте');
} else {
  console.log(`\n✗ Не хватает: ${missingRequired.join(', ')}`);
  process.exit(1);
}
