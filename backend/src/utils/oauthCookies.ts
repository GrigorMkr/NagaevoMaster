import type { Response, Request } from 'express';
import { env } from '../config/env.js';

function cookieSuffix(path: string): string {
  const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
  return `; Path=${path}; HttpOnly; SameSite=Lax${secure}`;
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    if (key === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return undefined;
}

function setVkOAuthCookies(res: Response, state: string, codeVerifier: string) {
  const suffix = cookieSuffix('/api/auth');
  res.append('Set-Cookie', `vk_oauth_state=${encodeURIComponent(state)}${suffix}; Max-Age=600`);
  res.append('Set-Cookie', `vk_code_verifier=${encodeURIComponent(codeVerifier)}${suffix}; Max-Age=600`);
}

function clearVkOAuthCookies(res: Response) {
  const suffix = cookieSuffix('/api/auth');
  res.append('Set-Cookie', `vk_oauth_state=${suffix}; Max-Age=0`);
  res.append('Set-Cookie', `vk_code_verifier=${suffix}; Max-Age=0`);
}

function setGoogleOAuthCookies(res: Response, state: string) {
  const suffix = cookieSuffix('/api/auth');
  res.append('Set-Cookie', `google_oauth_state=${encodeURIComponent(state)}${suffix}; Max-Age=600`);
}

function clearGoogleOAuthCookies(res: Response) {
  const suffix = cookieSuffix('/api/auth');
  res.append('Set-Cookie', `google_oauth_state=${suffix}; Max-Age=0`);
}

function setOAuthNativeCookie(res: Response) {
  const suffix = cookieSuffix('/api/auth');
  res.append('Set-Cookie', `oauth_native=1${suffix}; Max-Age=600`);
}

function readOAuthNative(req: Request): boolean {
  return readCookie(req, 'oauth_native') === '1';
}

function clearOAuthNativeCookie(res: Response) {
  const suffix = cookieSuffix('/api/auth');
  res.append('Set-Cookie', `oauth_native=${suffix}; Max-Age=0`);
}

export {
  readCookie,
  setVkOAuthCookies,
  clearVkOAuthCookies,
  setGoogleOAuthCookies,
  clearGoogleOAuthCookies,
  setOAuthNativeCookie,
  readOAuthNative,
  clearOAuthNativeCookie,
};
