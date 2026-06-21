const NOTICE_DEDUPE_MS = 20000;

const recentNotices = new Map<string, number>();

function tryClaimMessageNotice(messageId: string): boolean {
  const key = `message:${messageId}`;
  const now = Date.now();
  const prev = recentNotices.get(key);
  if (prev !== undefined && now - prev < NOTICE_DEDUPE_MS) {
    return false;
  }
  recentNotices.set(key, now);
  for (const [entryKey, timestamp] of recentNotices) {
    if (now - timestamp >= NOTICE_DEDUPE_MS) {
      recentNotices.delete(entryKey);
    }
  }
  return true;
}

export {
  tryClaimMessageNotice,
};
