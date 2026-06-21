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

export {
  touchPresence,
  getOnlineStats,
}
