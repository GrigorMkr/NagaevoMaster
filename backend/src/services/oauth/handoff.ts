import { randomUUID } from 'node:crypto';

const TTL_MS = 5 * 60 * 1000;
const handoffs = new Map<string, { token: string; expiresAt: number }>();

function pruneExpired() {
  const now = Date.now();
  for (const [id, entry] of handoffs) {
    if (entry.expiresAt <= now) {
      handoffs.delete(id);
    }
  }
}

function createOAuthHandoff(token: string): string {
  pruneExpired();
  const id = randomUUID();
  handoffs.set(id, { token, expiresAt: Date.now() + TTL_MS });
  return id;
}

function consumeOAuthHandoff(id: string): string | null {
  const entry = handoffs.get(id);
  if (!entry) return null;
  handoffs.delete(id);
  if (entry.expiresAt <= Date.now()) return null;
  return entry.token;
}

export {
  createOAuthHandoff,
  consumeOAuthHandoff,
};
