/**
 * Aeza API client.
 * @see https://my.aeza.net/settings/apikeys
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = resolve(root, 'deploy/vps-de.env');

export function loadAezaEnv() {
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

export function getAezaToken(env = loadAezaEnv()) {
  const key = env.AEZA_API_KEY?.trim();
  if (!key) {
    throw new Error('Заполните AEZA_API_KEY в deploy/vps-de.env (https://my.aeza.net/settings/apikeys)');
  }
  return key;
}

export function getAezaBase(env = loadAezaEnv()) {
  return (env.AEZA_API_URL ?? 'https://my.aeza.net/api').replace(/\/$/, '');
}

export async function aezaFetch(path, { method = 'GET', body } = {}, env = loadAezaEnv()) {
  const url = `${getAezaBase(env)}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAezaToken(env)}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(`Aeza ${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

export async function listServices(env = loadAezaEnv()) {
  const data = await aezaFetch('/services', {}, env);
  return data?.data?.items ?? data?.items ?? data?.services ?? [];
}

export function findService(services, env = loadAezaEnv()) {
  const byId = env.AEZA_SERVICE_ID?.trim();
  if (byId) return services.find((s) => String(s.id) === String(byId));
  const ip = env.VPS_DE_HOST?.trim();
  if (ip) {
    return services.find((s) => s.ip === ip || s.parameters?.ip === ip);
  }
  return services[0];
}

export async function serviceAction(serviceId, action, env = loadAezaEnv()) {
  return aezaFetch(`/services/${serviceId}/ctl`, { method: 'POST', body: { action } }, env);
}
