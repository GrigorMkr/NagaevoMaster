/**
 * Serverspace API — общий клиент.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, 'deploy/vps-de.env');

export function loadVpsDeEnv() {
  const file = existsSync(envPath)
    ? Object.fromEntries(
        readFileSync(envPath, 'utf8')
          .split('\n')
          .filter((l) => l && !l.startsWith('#'))
          .map((l) => {
            const i = l.indexOf('=');
            return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
          }),
      )
    : {};
  return { ...file, ...process.env };
}

export function getApiKey(env = loadVpsDeEnv()) {
  const key = env.SERVERSPACE_API_KEY?.trim();
  if (!key) {
    throw new Error('Заполните SERVERSPACE_API_KEY в deploy/vps-de.env');
  }
  return key;
}

export function getApiBase(env = loadVpsDeEnv()) {
  return (env.SERVERSPACE_API_URL ?? 'https://api.serverspace.io/api/v1').replace(/\/$/, '');
}

export async function ssFetch(path, { method = 'GET', body } = {}, env = loadVpsDeEnv()) {
  const url = `${getApiBase(env)}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': getApiKey(env),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(`Serverspace ${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function listServers(env = loadVpsDeEnv()) {
  const data = await ssFetch('/servers', {}, env);
  return data.servers ?? [];
}

export function findServer(servers, env = loadVpsDeEnv()) {
  const byId = env.SERVERSPACE_SERVER_ID?.trim();
  if (byId) return servers.find((s) => s.id === byId);
  const ip = env.VPS_DE_HOST?.trim();
  if (ip) {
    return servers.find((s) =>
      (s.nics ?? []).some((n) => n.ip_address === ip),
    );
  }
  return servers[0];
}
