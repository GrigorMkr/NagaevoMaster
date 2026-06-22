/**
 * Создаёт android/local.properties (sdk.dir + java.home) для Gradle/Capacitor.
 * Также прописывает org.gradle.java.home и .idea/gradle.xml для Android Studio.
 *
 *   node scripts/setup-android-local.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findJavaHome } from './resolve-java-home.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const localProps = path.join(androidDir, 'local.properties');
const gradlePropsPath = path.join(androidDir, 'gradle.properties');
const ideaGradleXml = path.join(androidDir, '.idea', 'gradle.xml');

const GRADLE_JAVA_HOME_BEGIN = '# --- org.gradle.java.home (npm run android:env) ---';
const GRADLE_JAVA_HOME_END = '# --- end org.gradle.java.home ---';

function findAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    'C:\\Android\\Sdk',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'platforms'))) {
      return candidate;
    }
  }
  return null;
}

function escapePropertyPath(value) {
  return value.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
}

function toIdeaPath(value) {
  return value.replace(/\\/g, '/');
}

function syncGradleJavaHome(javaHome) {
  let gradleProps = existsSync(gradlePropsPath)
    ? readFileSync(gradlePropsPath, 'utf8')
    : '';
  const block = [
    GRADLE_JAVA_HOME_BEGIN,
    `org.gradle.java.home=${escapePropertyPath(javaHome)}`,
    GRADLE_JAVA_HOME_END,
    '',
  ].join('\n');
  const blockPattern = new RegExp(
    `${GRADLE_JAVA_HOME_BEGIN}[\\s\\S]*?${GRADLE_JAVA_HOME_END}\\n?`,
    'g',
  );
  gradleProps = gradleProps.replace(blockPattern, '').trimEnd();
  writeFileSync(
    gradlePropsPath,
    gradleProps ? `${gradleProps}\n\n${block}` : block,
    'utf8',
  );
}

function syncAndroidStudioGradleJvm(javaHome) {
  mkdirSync(path.dirname(ideaGradleXml), { recursive: true });
  const jvmPath = toIdeaPath(javaHome);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="GradleSettings">
    <option name="linkedExternalProjectsSettings">
      <GradleProjectSettings>
        <option name="externalProjectPath" value="$PROJECT_DIR$" />
        <option name="gradleJvm" value="${jvmPath}" />
        <option name="modules">
          <set>
            <option value="$PROJECT_DIR$" />
            <option value="$PROJECT_DIR$/app" />
          </set>
        </option>
      </GradleProjectSettings>
    </option>
  </component>
</project>
`;
  writeFileSync(ideaGradleXml, xml, 'utf8');
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error(`
Не найден Java (JDK 17+).

Установите Android Studio (включает JDK 21):
  winget install Google.AndroidStudio

Или Microsoft OpenJDK 21:
  winget install Microsoft.OpenJDK.21

Затем снова:
  node scripts/setup-android-local.mjs
`);
  process.exit(1);
}

const androidSdk = findAndroidSdk();
if (!androidSdk) {
  console.error(`
Не найден Android SDK. Откройте Android Studio один раз — он скачает SDK.

Или укажите:
  set ANDROID_HOME=%LOCALAPPDATA%\\Android\\Sdk
`);
  process.exit(1);
}

const content = [
  `sdk.dir=${escapePropertyPath(androidSdk)}`,
  `java.home=${escapePropertyPath(javaHome)}`,
  '',
].join('\n');

writeFileSync(localProps, content, 'utf8');
syncGradleJavaHome(javaHome);
syncAndroidStudioGradleJvm(javaHome);

console.log(`JAVA_HOME: ${javaHome}`);
console.log(`ANDROID_SDK: ${androidSdk}`);
console.log(`Записано: ${path.relative(root, localProps)}`);
console.log(`Gradle JVM: ${path.relative(root, gradlePropsPath)}`);
console.log(`Android Studio: ${path.relative(root, ideaGradleXml)}`);
console.log(`
В Android Studio: File → Settings → Build Tools → Gradle → Gradle JDK
  выберите JDK 21 из Android Studio (jbr), не «Download JDK» / JetBrains.
Задача updateDaemonJvm не нужна — можно сразу Sync Project и Run.
`);
