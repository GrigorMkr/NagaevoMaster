import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { resolveAbsoluteApiBase } from '@/utils/apiBase';

const VISITOR_ID_STORAGE_KEY = 'nm_visitor_id';

function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, id);
  return id;
}

function readAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers['X-Visitor-Id'] = getOrCreateVisitorId();
  }
  return headers;
}

async function sendPresenceHeartbeat(): Promise<void> {
  await fetch(`${resolveAbsoluteApiBase()}/presence/heartbeat`, {
    method: 'POST',
    headers: readAuthHeaders(),
    credentials: 'include',
  });
}

async function fetchUsersOnlineStatus(userIds: string[]): Promise<Record<string, boolean>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return {};
  }

  const params = new URLSearchParams({ ids: uniqueIds.join(',') });
  const response = await fetch(`${resolveAbsoluteApiBase()}/presence/users?${params}`, {
    headers: readAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    return {};
  }

  const payload = await response.json() as { online?: Record<string, boolean> };
  return payload.online ?? {};
}

export {
  sendPresenceHeartbeat,
  fetchUsersOnlineStatus,
};
