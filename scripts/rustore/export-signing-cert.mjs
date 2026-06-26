/**
 * Экспорт сертификата подписи APK (PEM) для RuStore Console.
 *
 *   npm run rustore:cert
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findJavaHome } from '../resolve-java-home.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const androidDir = path.join(root, 'android');
const keystorePropsPath = path.join(androidDir, 'keystore.properties');
const outDir = path.join(root, 'artifacts', 'rustore');

function readKeystoreProps() {
  if (!existsSync(keystorePropsPath)) {
    throw new Error('Нет android/keystore.properties — сначала: npm run build:apk');
  }

  const props = Object.fromEntries(
    readFileSync(keystorePropsPath, 'utf8')
      .split('\n')
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );

  if (!props.storeFile || !props.storePassword || !props.keyAlias) {
    throw new Error('Неполный android/keystore.properties');
  }

  return props;
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error('Не найден JDK. Запустите: npm run android:env');
  process.exit(1);
}

const props = readKeystoreProps();
const keystoreFile = path.join(androidDir, props.storeFile);
const keytool = path.join(javaHome, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool');

mkdirSync(outDir, { recursive: true });

const pemPath = path.join(outDir, 'upload-certificate.pem');
const result = spawnSync(
  keytool,
  [
    '-exportcert',
    '-rfc',
    '-alias', props.keyAlias,
    '-keystore', keystoreFile,
    '-storepass', props.storePassword,
    '-file', pemPath,
  ],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const shaResult = spawnSync(
  keytool,
  [
    '-list',
    '-v',
    '-alias', props.keyAlias,
    '-keystore', keystoreFile,
    '-storepass', props.storePassword,
  ],
  { encoding: 'utf8' },
);

const sha256 = shaResult.stdout?.match(/SHA256:\s*(.+)/)?.[1]?.trim() ?? '—';

const readme = `Сертификат подписи для RuStore Console
=====================================

Файл: upload-certificate.pem
SHA-256: ${sha256}

Загрузите PEM в консоли при публикации AAB или для проверки подписи APK.
Документация: mobile/RUSTORE.md
`;

writeFileSync(path.join(outDir, 'README.txt'), readme, 'utf8');

console.log(`Сертификат: ${path.relative(root, pemPath)}`);
console.log(`SHA-256: ${sha256}`);
