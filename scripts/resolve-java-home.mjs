import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

function listMicrosoftJdks() {
  const base = 'C:\\Program Files\\Microsoft';
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('jdk-'))
    .map((entry) => path.join(base, entry.name));
}

const JDK_CANDIDATES = [
  process.env.JAVA_HOME,
  process.env.JDK_HOME,
  `${process.env.ProgramFiles}\\Android\\Android Studio\\jbr`,
  `${process.env.LOCALAPPDATA}\\Programs\\Android\\Android Studio\\jbr`,
  'C:\\Program Files\\Android\\Android Studio\\jbr',
  ...listMicrosoftJdks().sort((a, b) => b.localeCompare(a)),
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17',
].filter(Boolean);

function readJavaMajorVersion(javaHome) {
  const javaExe = path.join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  const result = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const output = `${result.stderr ?? ''}${result.stdout ?? ''}`;
  const match = output.match(/version "(\d+)/);
  return match ? Number(match[1]) : 0;
}

function findJavaHome() {
  let fallback = null;

  for (const candidate of JDK_CANDIDATES) {
    const javaExe = path.join(candidate, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (!existsSync(javaExe)) continue;

    const major = readJavaMajorVersion(candidate);
    if (major >= 21) return candidate;
    if (!fallback) fallback = candidate;
  }

  return fallback;
}

export {
  findJavaHome,
  JDK_CANDIDATES,
};
