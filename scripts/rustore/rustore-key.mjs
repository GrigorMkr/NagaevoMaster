/**
 * RuStore API: PKCS#8 ключ и подпись SHA512withRSA (keyId + timestamp).
 * @see https://www.rustore.ru/help/work-with-rustore-api/api-authorization-token
 */
import { createPrivateKey, createPublicKey, createSign, createVerify } from 'node:crypto';

export function formatRuStoreTimestamp(date = new Date()) {
  return date.toISOString().replace('Z', '+00:00');
}

export function loadRuStorePrivateKey(raw) {
  const trimmed = raw.replace(/\\n/g, '\n').trim();
  if (!trimmed) {
    throw new Error('RUSTORE_PRIVATE_KEY пуст');
  }
  if (trimmed.includes('BEGIN')) {
    return createPrivateKey(trimmed);
  }
  const der = Buffer.from(trimmed.replace(/\s/g, ''), 'base64');
  try {
    return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
  } catch {
    return createPrivateKey({ key: der, format: 'der', type: 'pkcs1' });
  }
}

export function signRuStoreRequest(keyId, timestamp, rawPrivateKey) {
  const keyObject = loadRuStorePrivateKey(rawPrivateKey);
  const payload = `${keyId}${timestamp}`;
  const signer = createSign('RSA-SHA512');
  signer.update(payload, 'utf8');
  signer.end();
  return signer.sign(keyObject).toString('base64');
}

export function verifyRuStoreSignature(keyId, timestamp, rawPrivateKey, signatureBase64) {
  const keyObject = loadRuStorePrivateKey(rawPrivateKey);
  const publicKey = createPublicKey(keyObject);
  const payload = `${keyId}${timestamp}`;
  const verifier = createVerify('RSA-SHA512');
  verifier.update(payload, 'utf8');
  verifier.end();
  return verifier.verify(publicKey, signatureBase64, 'base64');
}

export function buildRuStoreAuthBody(keyId, timestamp, rawPrivateKey) {
  const signature = signRuStoreRequest(keyId, timestamp, rawPrivateKey);
  if (!verifyRuStoreSignature(keyId, timestamp, rawPrivateKey, signature)) {
    throw new Error('Локальная проверка подписи не прошла — проверьте RUSTORE_PRIVATE_KEY');
  }
  return {
    keyId: String(keyId),
    timestamp,
    signature,
  };
}

export const RUSTORE_AUTH_URL = 'https://public-api.rustore.ru/public/auth/';
