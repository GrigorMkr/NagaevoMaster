/**
 * Скачивает ключ сервисного аккаунта Firebase Admin для FCM HTTP v1.
 * Требует: firebase login, deploy/google-services.json или FIREBASE_PROJECT_ID.
 *
 *   npm run fcm:setup
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const auth = require('firebase-tools/lib/auth');
const apiv2 = require('firebase-tools/lib/apiv2');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serviceAccountPath = path.join(root, 'deploy', 'firebase-service-account.json');
const pushEnvPath = path.join(root, 'deploy', 'push.env');
const googleServicesPath = path.join(root, 'deploy', 'google-services.json');

function resolveProjectId() {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }
  if (existsSync(googleServicesPath)) {
    const json = JSON.parse(readFileSync(googleServicesPath, 'utf8'));
    if (json?.project_info?.project_id) {
      return json.project_info.project_id;
    }
  }
  return 'nagaevomaster';
}

async function getFirebaseAccessToken() {
  const account = auth.getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) {
    throw new Error('Выполните: npx firebase login');
  }

  auth.setRefreshToken(account.tokens.refresh_token);
  if (account.tokens.access_token) {
    apiv2.setAccessToken(account.tokens.access_token);
  }

  return apiv2.getAccessToken();
}

async function apiRequest(token, url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message = typeof body === 'object' && body?.error?.message
      ? body.error.message
      : text.slice(0, 300);
    throw new Error(`${response.status} ${message}`);
  }

  return body;
}

async function findFirebaseAdminServiceAccount(token, projectId) {
  const data = await apiRequest(
    token,
    `https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts`,
  );

  const accounts = data?.accounts ?? [];
  const adminSdk = accounts.find((account) => account.email?.includes('firebase-adminsdk'));
  if (!adminSdk?.name) {
    throw new Error(`Не найден firebase-adminsdk сервисный аккаунт в проекте ${projectId}`);
  }

  return adminSdk.name;
}

async function createServiceAccountKey(token, serviceAccountName) {
  return apiRequest(token, `https://iam.googleapis.com/v1/${serviceAccountName}/keys`, {
    method: 'POST',
    body: JSON.stringify({
      privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
      keyAlgorithm: 'KEY_ALG_RSA_2048',
    }),
  });
}

function upsertPushEnv(projectId) {
  const lines = existsSync(pushEnvPath)
    ? readFileSync(pushEnvPath, 'utf8').split('\n')
    : [];

  const map = new Map();
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 1) continue;
    map.set(line.slice(0, index).trim(), line.slice(index + 1).trim());
  }

  map.set('FCM_PROJECT_ID', projectId);
  map.delete('FCM_SERVER_KEY');

  const orderedKeys = [
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'VAPID_SUBJECT',
    'FCM_PROJECT_ID',
  ];

  const output = [];
  for (const key of orderedKeys) {
    if (map.has(key)) {
      output.push(`${key}=${map.get(key)}`);
      map.delete(key);
    }
  }
  for (const [key, value] of map.entries()) {
    output.push(`${key}=${value}`);
  }

  writeFileSync(pushEnvPath, `${output.join('\n')}\n`, 'utf8');
}

async function main() {
  if (existsSync(serviceAccountPath)) {
    try {
      const existing = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      if (existing?.private_key && existing?.client_email) {
        console.log(`firebase-service-account.json уже есть: ${path.relative(root, serviceAccountPath)}`);
        upsertPushEnv(resolveProjectId());
        return;
      }
    } catch {
      // recreate below
    }
  }

  const projectId = resolveProjectId();
  const token = await getFirebaseAccessToken();
  const serviceAccountName = await findFirebaseAdminServiceAccount(token, projectId);
  const key = await createServiceAccountKey(token, serviceAccountName);
  const privateKeyData = key?.privateKeyData;

  if (!privateKeyData) {
    throw new Error('IAM API не вернул privateKeyData');
  }

  const jsonText = Buffer.from(privateKeyData, 'base64').toString('utf8');
  const credentials = JSON.parse(jsonText);
  writeFileSync(serviceAccountPath, `${JSON.stringify(credentials, null, 2)}\n`, 'utf8');
  upsertPushEnv(projectId);

  console.log(`Сервисный аккаунт сохранён: ${path.relative(root, serviceAccountPath)}`);
  console.log(`FCM_PROJECT_ID=${projectId} → deploy/push.env`);
}

await main();
