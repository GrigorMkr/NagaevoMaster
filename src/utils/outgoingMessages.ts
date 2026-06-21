const outgoingMessageIds = new Map<string, number>();
const OUTGOING_TTL_MS = 30000;

function registerOutgoingMessage(messageId: string): void {
  outgoingMessageIds.set(messageId, Date.now());
}

function isOutgoingMessage(messageId: string): boolean {
  const sentAt = outgoingMessageIds.get(messageId);
  if (!sentAt) return false;
  if (Date.now() - sentAt > OUTGOING_TTL_MS) {
    outgoingMessageIds.delete(messageId);
    return false;
  }
  return true;
}

function pruneOutgoingMessages(): void {
  const now = Date.now();
  for (const [id, sentAt] of outgoingMessageIds) {
    if (now - sentAt > OUTGOING_TTL_MS) {
      outgoingMessageIds.delete(id);
    }
  }
}

export {
  registerOutgoingMessage,
  isOutgoingMessage,
  pruneOutgoingMessages,
};
