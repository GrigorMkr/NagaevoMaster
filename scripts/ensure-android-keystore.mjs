import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const keystoreFile = path.join(androidDir, 'nagaevomaster-release.keystore');
const keystoreProps = path.join(androidDir, 'keystore.properties');

export function ensureAndroidKeystore(javaHome) {
  if (existsSync(keystoreFile) && existsSync(keystoreProps)) {
    return keystoreProps;
  }

  const password = `Nm${randomBytes(16).toString('hex')}`;
  const keytool = path.join(
    javaHome,
    'bin',
    process.platform === 'win32' ? 'keytool.exe' : 'keytool',
  );

  if (!existsSync(keytool)) {
    throw new Error(`keytool не найден: ${keytool}`);
  }

  console.log('Создаём ключ подписи APK (один раз, сохраните android/keystore.properties и .keystore)…');

  const result = spawnSync(
    keytool,
    [
      '-genkeypair',
      '-v',
      '-storetype', 'PKCS12',
      '-keystore', keystoreFile,
      '-alias', 'nagaevomaster',
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', '10000',
      '-storepass', password,
      '-keypass', password,
      '-dname', 'CN=Nagaevo Master, OU=Mobile, O=Nagaevo Master, L=Nagaevo, ST=DAG, C=RU',
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    throw new Error('Не удалось создать keystore');
  }

  const props = [
    'storeFile=nagaevomaster-release.keystore',
    'storePassword=' + password,
    'keyAlias=nagaevomaster',
    'keyPassword=' + password,
    '',
  ].join('\n');

  writeFileSync(keystoreProps, props, 'utf8');
  console.log(`Ключ создан: ${path.relative(root, keystoreFile)}`);

  return keystoreProps;
}
