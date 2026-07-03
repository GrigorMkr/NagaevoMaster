/**
 * Keenetic challenge-response auth (RCI).
 * GET /auth → X-NDM-Challenge + X-NDM-Realm → POST /auth
 */
import { createHash } from 'node:crypto';
import { keeneticEnv, requirePassword } from './lib.mjs';

function hash(algo, text) {
  return createHash(algo).update(text, 'utf8').digest('hex');
}

export async function keeneticAuth(env = keeneticEnv()) {
  const password = requirePassword(env);
  const base = `http://${env.host}`;
  const probe = await fetch(`${base}/auth`, { method: 'GET', redirect: 'manual' });

  const probeCookies = probe.headers.getSetCookie?.() ?? [];
  const cookieHeader = probeCookies.map((c) => c.split(';')[0]).join('; ');

  if (probe.status === 200 && cookieHeader) {
    return cookieHeader;
  }

  const challenge = probe.headers.get('x-ndm-challenge') ?? probe.headers.get('X-NDM-Challenge');
  const realm = probe.headers.get('x-ndm-realm') ?? probe.headers.get('X-NDM-Realm');

  if (!challenge || !realm) {
    throw new Error(`Нет challenge/realm (HTTP ${probe.status}). Проверьте http://${env.host}`);
  }

  const md5 = hash('md5', `${env.login}:${realm}:${password}`);
  const sha = hash('sha256', `${challenge}${md5}`);

  const res = await fetch(`${base}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({ login: env.login, password: sha }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`auth ${res.status}: ${body.slice(0, 200)}`);
  }

  const cookies = [...probeCookies, ...(res.headers.getSetCookie?.() ?? [])];
  const cookie = cookies.map((c) => c.split(';')[0]).join('; ');
  if (!cookie) {
    try {
      const j = JSON.parse(body);
      if (j.token) return `ndmSid=${j.token}`;
    } catch { /* ignore */ }
  }
  if (!cookie) throw new Error('Авторизация прошла, но cookie не получен');
  return cookie;
}

export async function keeneticRci(path, payload, { method = 'POST', env = keeneticEnv() } = {}) {
  const cookie = await keeneticAuth(env);
  const res = await fetch(`http://${env.host}/rci/${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: cookie,
    },
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`rci ${path} ${res.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

/** Пакетные команды RCI (создание интерфейса и т.п.). */
export async function keeneticRciBatch(batch, { env = keeneticEnv() } = {}) {
  const cookie = await keeneticAuth(env);
  const res = await fetch(`http://${env.host}/rci/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(batch),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`rci batch ${res.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}
