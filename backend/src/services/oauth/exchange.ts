import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const EXCHANGE_PURPOSE = 'oauth-exchange';
const TTL_SECONDS = 5 * 60;

interface OAuthExchangePayload {
  purpose: string;
  authToken: string;
}

function createOAuthExchangeCode(token: string): string {
  return jwt.sign(
    { purpose: EXCHANGE_PURPOSE, authToken: token } satisfies OAuthExchangePayload,
    env.JWT_SECRET,
    { expiresIn: TTL_SECONDS },
  );
}

function consumeOAuthExchangeCode(code: string): string | null {
  try {
    const payload = jwt.verify(code, env.JWT_SECRET) as OAuthExchangePayload;
    if (payload.purpose !== EXCHANGE_PURPOSE || typeof payload.authToken !== 'string') {
      return null;
    }
    return payload.authToken;
  } catch {
    return null;
  }
}

export {
  createOAuthExchangeCode,
  consumeOAuthExchangeCode,
};
