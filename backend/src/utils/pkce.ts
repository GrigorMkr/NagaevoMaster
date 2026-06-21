import { createHash, randomBytes } from 'node:crypto';

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function generateOAuthState(): string {
  return base64UrlEncode(randomBytes(32));
}

function generateCodeVerifier(): string {
  return base64UrlEncode(randomBytes(48));
}

function generateCodeChallenge(verifier: string): string {
  return base64UrlEncode(createHash('sha256').update(verifier).digest());
}

export {
  generateOAuthState,
  generateCodeVerifier,
  generateCodeChallenge,
};
