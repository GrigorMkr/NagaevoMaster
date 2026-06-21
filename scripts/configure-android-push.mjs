import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const googleServicesPath = path.join(root, 'android', 'app', 'google-services.json');
const buildGradlePath = path.join(root, 'android', 'app', 'capacitor.build.gradle');
const settingsGradlePath = path.join(root, 'android', 'capacitor.settings.gradle');

const PUSH_IMPL = "    implementation project(':capacitor-push-notifications')";
const PUSH_SETTINGS = `include ':capacitor-push-notifications'
project(':capacitor-push-notifications').projectDir = new File('../node_modules/@capacitor/push-notifications/android')
`;

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function writeText(filePath, content) {
  writeFileSync(filePath, content, 'utf8');
}

function stripPushNotifications() {
  let changed = false;

  if (existsSync(buildGradlePath)) {
    const original = readText(buildGradlePath);
    const next = original
      .replace(/\r?\n\s*implementation project\(':capacitor-push-notifications'\)/g, '')
      .replace(/\n{3,}/g, '\n\n');
    if (next !== original) {
      writeText(buildGradlePath, next);
      changed = true;
    }
  }

  if (existsSync(settingsGradlePath)) {
    const original = readText(settingsGradlePath);
    const next = original
      .replace(/\r?\ninclude ':capacitor-push-notifications'\r?\nproject\(':capacitor-push-notifications'\)\.projectDir = new File\('\.\.\/node_modules\/@capacitor\/push-notifications\/android'\)\r?\n?/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
    if (next !== original) {
      writeText(settingsGradlePath, next);
      changed = true;
    }
  }

  return changed;
}

function ensurePushNotifications() {
  let changed = false;

  if (existsSync(buildGradlePath)) {
    const content = readText(buildGradlePath);
    if (!content.includes(PUSH_IMPL.trim())) {
      const next = content.replace(
        /(dependencies\s*\{[\s\S]*?)(}\s*\n)/,
        `$1${PUSH_IMPL}\n$2`,
      );
      if (next !== content) {
        writeText(buildGradlePath, next);
        changed = true;
      }
    }
  }

  if (existsSync(settingsGradlePath)) {
    const content = readText(settingsGradlePath);
    if (!content.includes("include ':capacitor-push-notifications'")) {
      const next = `${content.trimEnd()}\n\n${PUSH_SETTINGS}`;
      writeText(settingsGradlePath, next);
      changed = true;
    }
  }

  return changed;
}

const hasFirebase = existsSync(googleServicesPath);

if (hasFirebase) {
  const changed = ensurePushNotifications();
  console.log(changed
    ? 'Android push: Firebase найден, плагин push включён.'
    : 'Android push: Firebase найден, плагин push уже подключён.');
} else {
  const changed = stripPushNotifications();
  console.log(changed
    ? 'Android push: google-services.json не найден — плагин push отключён (иначе приложение падает при запуске).'
    : 'Android push: google-services.json не найден, плагин push уже отключён.');
}
