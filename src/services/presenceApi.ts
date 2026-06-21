import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';

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

async function sendPresenceHeartbeat(): Promise<void> {
  const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '/api';
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers['X-Visitor-Id'] = getOrCreateVisitorId();
  }

  await fetch(`${API_BASE_URL}/presence/heartbeat`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
}

export {
  sendPresenceHeartbeat,
}
