import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findJavaHome } from './resolve-java-home.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const keystoreFile = path.join(androidDir, 'nagaevomaster-release.keystore');
const keystoreProps = path.join(androidDir, 'keystore.properties');
const assetLinksPath = path.join(root, 'public', '.well-known', 'assetlinks.json');

function readKeystorePassword() {
  if (!existsSync(keystoreProps)) {
    return null;
  }
  const props = Object.fromEntries(
    readFileSync(keystoreProps, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
  return props.storePassword ?? null;
}

function extractSha256(javaHome, password) {
  const keytool = path.join(
    javaHome,
    'bin',
    process.platform === 'win32' ? 'keytool.exe' : 'keytool',
  );
  const result = spawnSync(
    keytool,
    ['-list', '-v', '-keystore', keystoreFile, '-alias', 'nagaevomaster', '-storepass', password],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || 'keytool failed');
  }
  const match = result.stdout.match(/SHA256:\s*([0-9A-F:]+)/i);
  if (!match) {
    throw new Error('SHA256 fingerprint not found in keytool output');
  }
  return match[1].replace(/:/g, '').toLowerCase();
}

export function syncAndroidAssetLinks(javaHome = findJavaHome()) {
  if (!existsSync(keystoreFile)) {
    console.warn('Keystore not found — assetlinks.json left unchanged.');
    return false;
  }
  const password = readKeystorePassword();
  if (!password || !javaHome) {
    console.warn('Cannot read keystore password or JAVA_HOME — assetlinks.json left unchanged.');
    return false;
  }

  const fingerprint = extractSha256(javaHome, password);
  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'ru.nagaevomaster.app',
        sha256_cert_fingerprints: [fingerprint],
      },
    },
  ];

  mkdirSync(path.dirname(assetLinksPath), { recursive: true });
  writeFileSync(assetLinksPath, `${JSON.stringify(assetLinks, null, 2)}\n`, 'utf8');
  console.log(`assetlinks.json updated (SHA256: ${fingerprint.slice(0, 12)}…)`);
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    syncAndroidAssetLinks();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
