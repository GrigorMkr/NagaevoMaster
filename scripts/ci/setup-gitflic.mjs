/**
 * Настройка GitFlic CI/CD: переменные, runner, проверка API.
 *
 *   npm run gitflic:setup
 *   npm run gitflic:setup -- --runner-only
 *   npm run gitflic:setup -- --variables-only
 *
 * Требуется deploy/gitflic.env (GITFLIC_TOKEN).
 * Секреты берутся из локальных файлов (keystore, google-services, vkmaps, rustore.env).
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GitFlicApi } from './gitflic-api.mjs';
import { findJavaHome } from '../resolve-java-home.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RUNNER_VERSION = '4.12.1';
const RUNNER_ZIP_URL = `https://github.com/GitFlic-Org/gitflic/releases/download/${RUNNER_VERSION}/gitflic-runner_${RUNNER_VERSION}.zip`;
const RUNNER_HOME = path.join(os.homedir(), 'gitflic-runner');

const flags = new Set(process.argv.slice(2));
const runnerOnly = flags.has('--runner-only');
const variablesOnly = flags.has('--variables-only');

function log(step, message) {
  console.log(`[gitflic:setup] ${step}: ${message}`);
}

function warn(message) {
  console.warn(`[gitflic:setup] WARN: ${message}`);
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadGitflicConfig() {
  const fromFile = loadEnvFile(path.join(root, 'deploy', 'gitflic.env'));
  return {
    token: process.env.GITFLIC_TOKEN || fromFile.GITFLIC_TOKEN || '',
    owner: process.env.GITFLIC_OWNER || fromFile.GITFLIC_OWNER || 'impherion',
    project: process.env.GITFLIC_PROJECT || fromFile.GITFLIC_PROJECT || 'nagaevo-master',
    company: process.env.GITFLIC_COMPANY || fromFile.GITFLIC_COMPANY || '',
  };
}

function readKeystoreProps() {
  const propsPath = path.join(root, 'android', 'keystore.properties');
  if (!existsSync(propsPath)) {
    throw new Error('Нет android/keystore.properties — сначала npm run build:apk');
  }
  return loadEnvFile(propsPath);
}

function readGoogleServicesJson() {
  const candidates = [
    path.join(root, 'deploy', 'google-services.json'),
    path.join(root, 'android', 'app', 'google-services.json'),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      return readFileSync(file, 'utf8').trim();
    }
  }
  return '';
}

function collectCiVariables() {
  const vars = {};
  const keystoreProps = readKeystoreProps();
  const keystorePath = path.join(root, 'android', keystoreProps.storeFile || 'nagaevomaster-release.keystore');

  if (!existsSync(keystorePath)) {
    throw new Error(`Keystore не найден: ${keystorePath}`);
  }

  vars.ANDROID_KEYSTORE_BASE64 = readFileSync(keystorePath).toString('base64');
  vars.ANDROID_KEYSTORE_PASSWORD = keystoreProps.storePassword;
  vars.ANDROID_KEY_ALIAS = keystoreProps.keyAlias || 'nagaevomaster';
  vars.ANDROID_KEY_PASSWORD = keystoreProps.keyPassword || keystoreProps.storePassword;

  const googleJson = readGoogleServicesJson();
  if (googleJson) {
    vars.GOOGLE_SERVICES_JSON = googleJson;
  } else {
    warn('google-services.json не найден — GOOGLE_SERVICES_JSON пропущен');
  }

  const vkmaps = loadEnvFile(path.join(root, 'deploy', 'vkmaps.env'));
  const secrets = loadEnvFile(path.join(root, 'deploy', 'secrets.local.env'));
  const rustore = loadEnvFile(path.join(root, 'deploy', 'rustore.env'));

  const vkKey = vkmaps.VK_MAPS_API_KEY || secrets.VK_MAPS_API_KEY;
  if (vkKey) {
    vars.VK_MAPS_API_KEY = vkKey;
  }

  const keyId = rustore.RUSTORE_KEY_ID || rustore.RS_KEY_ID || secrets.RUSTORE_KEY_ID;
  const privateKey = rustore.RUSTORE_PRIVATE_KEY || rustore.RS_PRIVATE_KEY || secrets.RUSTORE_PRIVATE_KEY;
  if (keyId) vars.RS_KEY_ID = keyId;
  if (privateKey) vars.RS_PRIVATE_KEY = privateKey;

  if (keyId && !privateKey) {
    warn('RUSTORE_KEY_ID задан, но RUSTORE_PRIVATE_KEY пуст — deploy:rustore не сработает');
  }
  if (!vars.RS_KEY_ID || !vars.RS_PRIVATE_KEY) {
    warn('RS_KEY_ID / RS_PRIVATE_KEY неполные — job deploy:rustore не сработает до заполнения deploy/rustore.env');
  }

  return vars;
}

function writeVariablesArtifacts(vars) {
  const outDir = path.join(root, 'artifacts', 'gitflic');
  mkdirSync(outDir, { recursive: true });

  const jsonUpload = { ENV_VARIABLES: vars };
  const jsonPath = path.join(outDir, 'ci-variables-upload.json');
  writeFileSync(jsonPath, `${JSON.stringify(jsonUpload, null, 2)}\n`, 'utf8');

  const csvLines = Object.entries(vars).map(([key, value]) => {
    const escaped = String(value).replace(/"/g, '""');
    return `${key},"${escaped}"`;
  });
  writeFileSync(path.join(outDir, 'ci-variables-upload.csv'), `${csvLines.join('\n')}\n`, 'utf8');

  const maskedKeys = Object.keys(vars);
  writeFileSync(
    path.join(outDir, 'ci-variables-keys.txt'),
    `${maskedKeys.join('\n')}\n`,
    'utf8',
  );

  log('variables', `файлы для загрузки в GitFlic UI → ${path.relative(root, outDir)}`);
  return jsonPath;
}

async function tryUploadVariablesViaApi(api, owner, project, company, vars) {
  const projectBase = `/project/${owner}/${project}/setting/cicd/variable`;
  const companyBase = company ? `/company/${company}/cicd/variable` : null;

  const attempts = [
    ['POST', `${projectBase}/create`, { variables: Object.entries(vars).map(([key, value]) => ({ key, value, mask: true })) }],
    ['POST', `${projectBase}/batch`, { ENV_VARIABLES: vars }],
    ['POST', `${projectBase}/import`, { ENV_VARIABLES: vars }],
    ['PUT', projectBase, Object.entries(vars).map(([key, value]) => ({ key, value, mask: true }))],
  ];

  if (companyBase) {
    attempts.push(
      ['POST', `${companyBase}/create`, { variables: Object.entries(vars).map(([key, value]) => ({ key, value, mask: true })) }],
      ['POST', `${companyBase}/import`, { ENV_VARIABLES: vars }],
    );
  }

  for (const [method, pathSuffix, body] of attempts) {
    const result = await api.request(method, pathSuffix, body);
    if (result.ok) {
      log('api', `переменные через ${method} ${pathSuffix} — OK (${result.status})`);
      return true;
    }
  }

  const existing = await api.get(`${projectBase}`);
  if (existing.ok) {
    const list = existing.data?._embedded?.restPipelineJobVariableModelList ?? [];
    const have = new Set(list.map((item) => item.key));
    const missing = Object.keys(vars).filter((key) => !have.has(key));
    if (missing.length === 0) {
      log('api', 'все переменные уже есть в GitFlic');
      return true;
    }
    log('api', `в GitFlic нет переменных: ${missing.join(', ')}`);
    log('api', 'загрузите artifacts/gitflic/ci-variables-upload.json в Настройки → CI/CD → Переменные');
  } else {
    warn(`не удалось прочитать переменные CI (${existing.status})`);
  }
  return false;
}

async function startPipelineWithVariables(api, owner, project, vars) {
  const body = {
    refName: 'main',
    isTag: false,
    variables: Object.entries(vars).map(([key, value]) => ({ key, value })),
  };
  const result = await api.post(`/project/${owner}/${project}/cicd/pipeline/start`, body);
  if (result.ok) {
    log('pipeline', `запущен с переменными: #${result.data?.localId ?? result.data?.pipeline_uuid ?? 'ok'}`);
    return true;
  }
  warn(`не удалось запустить пайплайн (${result.status})`);
  return false;
}

async function ensureCompany(api, configured) {
  if (configured) {
    const check = await api.get(`/company/${configured}/runners/registration-info`);
    if (check.ok) return configured;
  }

  const mine = await api.get('/company/my');
  if (mine.ok) {
    const list = mine.data?._embedded?.companyList ?? mine.data?._embedded?.restCompanyModelList ?? [];
    for (const company of list) {
      const alias = company.alias || company.selectorAlias;
      if (!alias) continue;
      const info = await api.get(`/company/${alias}/runners/registration-info`);
      if (info.ok && info.data?.registrationToken) {
        log('company', `используется существующая: ${alias}`);
        return alias;
      }
    }
  }

  const alias = 'nagaevomaster';
  log('company', `создание компании ${alias}…`);
  const created = await api.post('/company', {
    title: 'Нагаево Мастер',
    alias,
    isPrivate: true,
    description: 'CI/CD RuStore для nagaevomaster.ru',
  });

  if (!created.ok) {
    warn(`не удалось создать компанию (${created.status}) — создайте вручную на gitflic.ru`);
    return '';
  }

  const newAlias = created.data?.alias || alias;
  log('company', `создана: ${newAlias}`);
  return newAlias;
}

async function discoverCompany(api, owner, configured) {
  const ensured = await ensureCompany(api, configured);
  if (ensured) return ensured;

  const candidates = [owner, 'nagaevomaster', 'nagaevo-master'];
  for (const alias of [...new Set(candidates)]) {
    const info = await api.get(`/company/${alias}/runners/registration-info`);
    if (info.ok && info.data?.registrationToken) {
      log('company', `определена компания: ${alias}`);
      return alias;
    }
  }
  return '';
}

async function ensureRunner(api, company) {
  if (!company) {
    warn('компания не найдена — runner: укажите GITFLIC_COMPANY в deploy/gitflic.env');
    warn('URL: https://gitflic.ru/company/<company>/setting/cicd/runners');
    return false;
  }

  const reg = await api.get(`/company/${company}/runners/registration-info`);
  if (!reg.ok || !reg.data?.registrationToken) {
    warn(`registration-info (${reg.status}) — проверьте VK ID / Яндекс ID в аккаунте GitFlic`);
    return false;
  }

  const javaHome = findJavaHome();
  if (!javaHome) {
    throw new Error('Java не найдена — установите JDK 21+');
  }
  const javaExe = path.join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');

  mkdirSync(RUNNER_HOME, { recursive: true });
  mkdirSync(path.join(RUNNER_HOME, 'build'), { recursive: true });
  mkdirSync(path.join(RUNNER_HOME, 'cache'), { recursive: true });
  mkdirSync(path.join(RUNNER_HOME, 'data', 'log'), { recursive: true });

  const zipPath = path.join(RUNNER_HOME, `gitflic-runner_${RUNNER_VERSION}.zip`);
  if (!existsSync(path.join(RUNNER_HOME, 'runner.jar'))) {
    log('runner', `скачивание ${RUNNER_VERSION}…`);
    const response = await fetch(RUNNER_ZIP_URL);
    if (!response.ok) {
      throw new Error(`Не удалось скачать runner: HTTP ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(zipPath, buffer);

    const expand = spawnSync(
      'powershell',
      ['-NoProfile', '-Command', `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${RUNNER_HOME.replace(/'/g, "''")}' -Force`],
      { stdio: 'inherit' },
    );
    if (expand.status !== 0) {
      throw new Error('Expand-Archive завершился с ошибкой');
    }
  }

  const helperBatCandidates = [
    path.join(RUNNER_HOME, 'powershell-scripts', 'helper.bat'),
    path.join(RUNNER_HOME, 'scripts', 'helper.bat'),
  ];
  for (const src of helperBatCandidates) {
    if (existsSync(src)) {
      writeFileSync(path.join(RUNNER_HOME, 'helper.bat'), readFileSync(src));
      break;
    }
  }
  if (!existsSync(path.join(RUNNER_HOME, 'helper.bat'))) {
    throw new Error('helper.bat не найден в архиве runner — переустановите агент');
  }
  if (!existsSync(path.join(RUNNER_HOME, 'helper.jar'))) {
    throw new Error('helper.jar не найден в архиве runner');
  }

  const configPath = path.join(RUNNER_HOME, 'config', 'application.properties');
  const alreadyRegistered = existsSync(configPath);

  if (!alreadyRegistered) {
    log('runner', 'регистрация агента…');
    const register = spawnSync(
      javaExe,
      [
        '-jar',
        path.join(RUNNER_HOME, 'runner.jar'),
        'register',
        '--url',
        reg.data.registrationUrl,
        '--registration-token',
        reg.data.registrationToken,
        '--name',
        `nagaevomaster-${os.hostname()}`,
        '--tags',
        'android,rustore,nagaevomaster',
      ],
      { cwd: RUNNER_HOME, stdio: 'inherit', env: { ...process.env, JAVA_HOME: javaHome } },
    );
    if (register.status !== 0) {
      throw new Error('runner register завершился с ошибкой');
    }
  } else {
    log('runner', 'уже зарегистрирован — пропуск register');
  }

  const androidSdk = process.env.ANDROID_HOME
    || process.env.ANDROID_SDK_ROOT
    || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');

  const props = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
  const lines = new Set(props.split('\n').filter(Boolean));
  lines.add('runner.executor=powershell');
  lines.add('logging.file.name=data/log/server.log');
  lines.add('logging.level.root=INFO');
  lines.add('runner.runUntagged=true');
  if (androidSdk && existsSync(androidSdk)) {
    lines.add(`environment=ANDROID_HOME=${androidSdk.replace(/\\/g, '/')}`);
    lines.add(`environment=ANDROID_SDK_ROOT=${androidSdk.replace(/\\/g, '/')}`);
  }
  mkdirSync(path.dirname(configPath), { recursive: true });
  writeFileSync(configPath, `${[...lines].join('\n')}\n`, 'utf8');

  log('runner', `конфиг: ${configPath}`);
  log('runner', 'запуск в фоне (новое окно PowerShell)…');

  const startScript = [
    `$env:JAVA_HOME='${javaHome.replace(/'/g, "''")}'`,
    `$env:PATH="$env:JAVA_HOME\\bin;$env:PATH"`,
    androidSdk ? `$env:ANDROID_HOME='${androidSdk.replace(/'/g, "''")}'` : '',
    androidSdk ? `$env:ANDROID_SDK_ROOT='${androidSdk.replace(/'/g, "''")}'` : '',
    `Set-Location '${RUNNER_HOME.replace(/'/g, "''")}'`,
    `& '${javaExe.replace(/'/g, "''")}' -jar runner.jar start --config=config/application.properties`,
  ].filter(Boolean).join('; ');

  spawnSync(
    'powershell',
    ['-NoProfile', '-Command', `Start-Process powershell -ArgumentList '-NoExit','-NoProfile','-Command','${startScript.replace(/'/g, "''")}'`],
    { stdio: 'inherit' },
  );

  return true;
}

async function checkProjectAndPipeline(api, owner, project) {
  const info = await api.get(`/project/${owner}/${project}`);
  if (!info.ok) {
    warn(`проект ${owner}/${project} — HTTP ${info.status}`);
    return;
  }
  log('project', `${info.data?.title || project} (ветка: ${info.data?.defaultBranch || 'main'})`);

  const pipelines = await api.get(`/project/${owner}/${project}/cicd/pipeline?page=0&size=3`);
  if (pipelines.ok) {
    const list = pipelines.data?._embedded?.restPipelineModelList ?? [];
    if (list.length === 0) {
      log('pipeline', 'пайплайнов пока нет — после runner запустите push в main или npm run gitflic:pipeline');
    } else {
      log('pipeline', `последний: #${list[0].localId} ${list[0].status}`);
    }
  }
}

async function main() {
  const cfg = loadGitflicConfig();
  const api = new GitFlicApi(cfg.token);

  if (!variablesOnly) {
    await checkProjectAndPipeline(api, cfg.owner, cfg.project);
  }

  if (!runnerOnly) {
    const vars = collectCiVariables();
    writeVariablesArtifacts(vars);
    const company = await discoverCompany(api, cfg.owner, cfg.company);
    const uploaded = await tryUploadVariablesViaApi(api, cfg.owner, cfg.project, company, vars);
    if (!uploaded) {
      await startPipelineWithVariables(api, cfg.owner, cfg.project, vars);
    }
  }

  if (!variablesOnly) {
    const company = await discoverCompany(api, cfg.owner, cfg.company);
    await ensureRunner(api, company);
  }

  log('done', 'см. mobile/GITFLIC.md и artifacts/gitflic/');
}

main().catch((error) => {
  console.error(`[gitflic:setup] ERROR: ${error.message}`);
  process.exit(1);
});
