/**
 * Копирует или скачивает google-services.json для Android push.
 *
 * Источники (по приоритету):
 *   1. android/app/google-services.json — уже на месте
 *   2. deploy/google-services.json — скачанный из Firebase Console
 *   3. deploy/firebase-service-account.json — сервисный аккаунт с ролью Firebase Admin
 *   4. Firebase CLI (npx firebase apps:sdkconfig) — если выполнен firebase login
 *
 *   npm run android:firebase
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetPath = path.join(root, 'android', 'app', 'google-services.json');
const deployCopyPath = path.join(root, 'deploy', 'google-services.json');
const serviceAccountPath = path.join(root, 'deploy', 'firebase-service-account.json');
const packageName = 'ru.nagaevomaster.app';
const appDisplayName = 'Нагаево Мастер';

function resolveFirebaseProjectId() {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }

  const oauthPath = path.join(root, 'deploy', 'oauth.env');
  if (existsSync(oauthPath)) {
    const oauth = readFileSync(oauthPath, 'utf8');
    const fromClientId = oauth.match(/^GOOGLE_CLIENT_ID=(\d+)-/m);
    if (fromClientId?.[1] === '1048090373572') {
      return 'nagaevomaster';
    }
    if (fromClientId?.[1]) {
      return fromClientId[1];
    }
  }

  return 'nagaevomaster';
}

const defaultProjectId = resolveFirebaseProjectId();

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function isValidGoogleServices(data) {
  return Boolean(
    data?.project_info?.project_id
    && Array.isArray(data?.client)
    && data.client.some((client) => client?.client_info?.android_client_info?.package_name === packageName),
  );
}

function installTarget(sourcePath) {
  const data = readJson(sourcePath);
  if (!isValidGoogleServices(data)) {
    throw new Error(`Некорректный google-services.json: package_name должен быть ${packageName}`);
  }
  writeJson(targetPath, data);
  console.log(`google-services.json установлен: ${path.relative(root, targetPath)}`);
  return data;
}

async function fetchWithServiceAccount() {
  if (!existsSync(serviceAccountPath)) {
    return null;
  }

  const { JWT } = await import('google-auth-library');
  const serviceAccount = readJson(serviceAccountPath);
  const projectId = process.env.FIREBASE_PROJECT_ID ?? serviceAccount.project_id ?? defaultProjectId;

  const auth = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/firebase',
    ],
  });

  const accessToken = await auth.getAccessToken();
  if (!accessToken) {
    throw new Error('Не удалось получить access token из firebase-service-account.json');
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
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
        : text.slice(0, 240);
      throw new Error(`${response.status} ${message}`);
    }
    return body;
  }

  async function ensureFirebaseProject() {
    try {
      return await request(`https://firebase.googleapis.com/v1beta1/projects/${projectId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('404') && !message.includes('not found')) {
        throw error;
      }
    }

    const operation = await request('https://firebase.googleapis.com/v1beta1/projects:addFirebase', {
      method: 'POST',
      body: JSON.stringify({ project: `projects/${projectId}` }),
    });

    const operationName = operation?.name;
    if (!operationName) {
      throw new Error('Firebase API не вернул operation при создании проекта');
    }

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const status = await request(`https://firebase.googleapis.com/v1beta1/${operationName}`);
      if (status?.done) {
        if (status.error) {
          throw new Error(status.error.message ?? 'Ошибка создания Firebase-проекта');
        }
        return status.response ?? status;
      }
    }

    throw new Error('Таймаут ожидания создания Firebase-проекта');
  }

  async function findAndroidApp() {
    const list = await request(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps?pageSize=100`);
    const apps = list?.apps ?? [];
    return apps.find((app) => app.packageName === packageName) ?? null;
  }

  async function createAndroidApp() {
    const operation = await request(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps`, {
      method: 'POST',
      body: JSON.stringify({
        displayName: appDisplayName,
        packageName,
      }),
    });

    const operationName = operation?.name;
    if (!operationName) {
      throw new Error('Firebase API не вернул operation при создании Android-приложения');
    }

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const status = await request(`https://firebase.googleapis.com/v1beta1/${operationName}`);
      if (status?.done) {
        if (status.error) {
          throw new Error(status.error.message ?? 'Ошибка создания Android-приложения');
        }
        return status.response ?? status;
      }
    }

    throw new Error('Таймаут ожидания создания Android-приложения');
  }

  async function downloadConfig(appName) {
    const config = await request(`https://firebase.googleapis.com/v1beta1/${appName}/config`);
    const encoded = config?.configFileContents;
    if (!encoded) {
      throw new Error('Firebase API не вернул configFileContents');
    }
    const jsonText = Buffer.from(encoded, 'base64').toString('utf8');
    const data = JSON.parse(jsonText);
    writeJson(deployCopyPath, data);
    writeJson(targetPath, data);
    console.log(`Firebase Android app: ${appName}`);
    console.log(`google-services.json сохранён: ${path.relative(root, targetPath)}`);
    return data;
  }

  await ensureFirebaseProject();
  let app = await findAndroidApp();
  if (!app) {
    app = await createAndroidApp();
  }

  const appName = app?.name;
  if (!appName) {
    throw new Error('Не удалось определить имя Android-приложения в Firebase');
  }

  return downloadConfig(appName);
}

function fetchWithFirebaseCli() {
  const addFirebase = spawnSync('npx', ['firebase', 'projects:addfirebase', defaultProjectId, '--json'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });
  if (addFirebase.status !== 0 && addFirebase.stderr && !addFirebase.stderr.includes('already exists')) {
    console.warn(addFirebase.stderr.trim());
  }

  const apps = spawnSync('npx', ['firebase', 'apps:list', 'ANDROID', '--project', defaultProjectId, '--json'], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });

  if (apps.status !== 0) {
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(apps.stdout);
  } catch {
    return null;
  }

  const result = parsed?.result ?? parsed;
  const appsList = Array.isArray(result) ? result : result?.apps;
  const app = Array.isArray(appsList)
    ? appsList.find((item) => item?.namespace === packageName || item?.packageName === packageName)
    : null;

  const appId = app?.appId;
  if (!appId) {
    const create = spawnSync('npx', [
      'firebase',
      'apps:create',
      'ANDROID',
      appDisplayName,
      '--package-name',
      packageName,
      '--project',
      defaultProjectId,
      '--json',
    ], {
      cwd: root,
      encoding: 'utf8',
      shell: true,
    });

    if (create.status !== 0) {
      return null;
    }

    let created;
    try {
      created = JSON.parse(create.stdout);
    } catch {
      return null;
    }

    const createdAppId = created?.result?.appId ?? created?.appId;
    if (!createdAppId) {
      return null;
    }

    return downloadSdkConfig(createdAppId);
  }

  return downloadSdkConfig(appId);
}

function downloadSdkConfig(appId) {
  const sdk = spawnSync('npx', ['firebase', 'apps:sdkconfig', 'ANDROID', appId, '--project', defaultProjectId], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
  });

  if (sdk.status !== 0 || !sdk.stdout.trim()) {
    return null;
  }

  const data = JSON.parse(sdk.stdout);
  writeJson(deployCopyPath, data);
  writeJson(targetPath, data);
  console.log(`google-services.json получен через Firebase CLI (${appId})`);
  return data;
}

async function main() {
  if (existsSync(targetPath)) {
    const existing = readJson(targetPath);
    if (isValidGoogleServices(existing)) {
      console.log(`google-services.json уже есть: ${path.relative(root, targetPath)}`);
      return;
    }
  }

  if (existsSync(deployCopyPath)) {
    installTarget(deployCopyPath);
    return;
  }

  const fromServiceAccount = await fetchWithServiceAccount().catch((error) => {
    console.warn(`Service account: ${error instanceof Error ? error.message : error}`);
    return null;
  });
  if (fromServiceAccount) {
    return;
  }

  const fromCli = fetchWithFirebaseCli();
  if (fromCli) {
    return;
  }

  console.error(`
Не найден google-services.json для Android push.

Вариант A — вручную (быстрее всего):
  1. https://console.firebase.google.com/
  2. Создайте проект (например: ${defaultProjectId})
  3. Добавьте Android-приложение с package name: ${packageName}
  4. Скачайте google-services.json
  5. Положите в deploy/google-services.json
  6. Снова: npm run android:firebase

Вариант B — сервисный аккаунт:
  1. Firebase Console → Project settings → Service accounts → Generate new private key
  2. Сохраните как deploy/firebase-service-account.json
  3. npm run android:firebase

Вариант C — Firebase CLI:
  1. npx firebase login
  2. npx firebase projects:create ${defaultProjectId}
  3. npm run android:firebase
`);
  process.exit(1);
}

await main();
