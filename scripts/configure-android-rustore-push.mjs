import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, 'deploy', 'rustore-push.env');
const buildGradlePath = path.join(root, 'android', 'app', 'build.gradle');

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const values = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    values[key] = value;
  }
  return values;
}

function escapeGradleString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const env = loadEnv(envPath);
const projectId = env.RUSTORE_PUSH_PROJECT_ID?.trim() ?? '';

if (!existsSync(buildGradlePath)) {
  console.warn('android/app/build.gradle не найден — пропуск RuStore Push.');
  process.exit(0);
}

let content = readFileSync(buildGradlePath, 'utf8');
const fieldLine = `        buildConfigField "String", "RUSTORE_PUSH_PROJECT_ID", "\\"${escapeGradleString(projectId)}\\""`;

if (!content.includes('buildFeatures')) {
  content = content.replace(
    /(android\s*\{)/,
    '$1\n    buildFeatures {\n        buildConfig true\n    }',
  );
} else if (!content.includes('buildConfig true')) {
  content = content.replace(
    /(buildFeatures\s*\{)/,
    '$1\n        buildConfig true',
  );
}

if (content.includes('RUSTORE_PUSH_PROJECT_ID')) {
  content = content.replace(
    /buildConfigField "String", "RUSTORE_PUSH_PROJECT_ID", ".*"/,
    fieldLine.trim(),
  );
} else {
  content = content.replace(
    /(defaultConfig\s*\{)/,
    `$1\n${fieldLine}`,
  );
}

writeFileSync(buildGradlePath, content, 'utf8');

if (projectId) {
  console.log(`RuStore Push: project ID записан в BuildConfig (${projectId.slice(0, 8)}…).`);
} else {
  console.log('RuStore Push: deploy/rustore-push.env не задан — SDK не инициализируется (только FCM).');
}
