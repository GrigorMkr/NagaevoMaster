/**
 * SSH к Entware на Keenetic (root, не RCI admin).
 */
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'ssh2';
import { keeneticEnv } from './lib.mjs';

export function entwareSshConfig() {
  const env = keeneticEnv();
  const host = process.env.KEENETIC_ENTWARE_HOST ?? env.host;
  const port = Number(process.env.KEENETIC_ENTWARE_PORT ?? 222);
  const username = process.env.KEENETIC_ENTWARE_USER ?? 'root';
  const password = process.env.KEENETIC_ENTWARE_PASSWORD ?? 'keenetic';
  const keyName = process.env.KEENETIC_ENTWARE_KEY;
  const cfg = { host, port, username, readyTimeout: 30000 };

  if (keyName) {
    const keyPath = keyName.includes('/') || keyName.includes('\\')
      ? keyName
      : join(homedir(), '.ssh', keyName);
    if (existsSync(keyPath)) {
      cfg.privateKey = readFileSync(keyPath);
      return cfg;
    }
  }

  cfg.password = password;
  cfg.tryKeyboard = true;
  return cfg;
}

export function connectEntware() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => resolve(conn))
      .on('error', reject)
      .connect(entwareSshConfig());
  });
}

export function execEntware(conn, command, { timeoutMs = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`SSH timeout (${timeoutMs}ms)`)), timeoutMs);
    conn.exec(command, (err, stream) => {
      if (err) {
        clearTimeout(timer);
        reject(err);
        return;
      }
      let stdout = '';
      let stderr = '';
      stream.on('data', (d) => { stdout += d; });
      stream.stderr.on('data', (d) => { stderr += d; });
      stream.on('close', (code) => {
        clearTimeout(timer);
        resolve({ code, stdout, stderr });
      });
    });
  });
}

export async function runEntwareScript(lines, opts) {
  const conn = await connectEntware();
  try {
    const script = [
      'export PATH=/opt/sbin:/opt/bin:/opt/usr/sbin:/opt/usr/bin:$PATH',
      'export HOME=/opt/root',
      ...lines,
    ].join('\n');
    const wrapped = `sh -c ${JSON.stringify(script)}`;
    return await execEntware(conn, wrapped, opts);
  } finally {
    conn.end();
  }
}

export function writeEntwareFile(conn, remotePath, content) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const ws = sftp.createWriteStream(remotePath);
      ws.on('error', reject);
      ws.on('close', resolve);
      ws.end(content, 'utf8');
    });
  });
}
