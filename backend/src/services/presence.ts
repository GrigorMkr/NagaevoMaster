const PRESENCE_TTL_MS = 2 * 60 * 1000;

type PresenceType = 'guest' | 'user';

interface PresenceEntry {
  lastSeen: number;
  type: PresenceType;
}

const online = new Map<string, PresenceEntry>();

function prunePresence() {
  const now = Date.now();
  for (const [id, entry] of online) {
    if (now - entry.lastSeen > PRESENCE_TTL_MS) {
      online.delete(id);
    }
  }
}

function touchPresence(id: string, type: PresenceType) {
  online.set(id, { lastSeen: Date.now(), type });
}

function getOnlineStats() {
  prunePresence();
  let guestsOnline = 0;
  let usersOnline = 0;
  for (const entry of online.values()) {
    if (entry.type === 'guest') {
      guestsOnline += 1;
    } else {
      usersOnline += 1;
    }
  }
  return { guestsOnline, usersOnline };
}

function getUsersOnlineStatus(userIds: string[]): Record<string, boolean> {
  prunePresence();
  const result: Record<string, boolean> = {};
  for (const userId of userIds) {
    const entry = online.get(userId);
    result[userId] = entry?.type === 'user';
  }
  return result;
}

function getOnlineUserIds(): string[] {
  prunePresence();
  const ids: string[] = [];
  for (const [id, entry] of online) {
    if (entry.type === 'user' && !id.startsWith('guest:')) {
      ids.push(id);
    }
  }
  return ids;
}

export {
  touchPresence,
  getOnlineStats,
  getUsersOnlineStatus,
  getOnlineUserIds,
}
