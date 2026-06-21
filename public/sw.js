/// <reference lib="webworker" />

const PUSH_CHANNEL = 'nagaevo-push';
const SW_MESSAGE_TYPE = 'MESSAGE_PUSH';
const SW_SUBSCRIPTION_CHANGE = 'PUSH_SUBSCRIPTION_CHANGE';
const DB_NAME = 'nagaevo-sw';
const STORE = 'config';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveConfig(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function readConfig(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function hasVisibleClient() {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  return clients.some((client) => client.visibilityState === 'visible');
}

async function notifyOpenClients(payload) {
  const message = {
    type: SW_MESSAGE_TYPE,
    playSound: true,
    payload,
  };

  try {
    const channel = new BroadcastChannel(PUSH_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // ignore
  }

  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  await Promise.all(clients.map((client) => client.postMessage(message)));
}

self.addEventListener('push', (event) => {
  const payload = (() => {
    try {
      return event.data?.json() ?? {};
    } catch {
      return { title: 'Нагаево Мастер', body: event.data?.text() ?? 'Новое сообщение' };
    }
  })();

  const title = payload.senderName ?? payload.title ?? 'Новое сообщение';
  const body = payload.body ?? '';
  const tag = payload.tag ?? (payload.messageId ? `message-${payload.messageId}` : 'nagaevo-message');

  event.waitUntil(
    (async () => {
      const visible = await hasVisibleClient();

      if (visible) {
        await notifyOpenClients(payload);
      }

      return self.registration.showNotification(title, {
        body,
        icon: payload.icon ?? '/apple-touch-icon.png',
        badge: '/favicon-32.png',
        tag,
        renotify: true,
        silent: visible,
        vibrate: visible ? undefined : [120, 60, 120],
        data: {
          url: payload.url ?? '/profile?section=messages',
          senderName: payload.senderName ?? title,
          preview: body,
          messageId: payload.messageId,
        },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/profile?section=messages';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.navigate(absoluteUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
      return undefined;
    }),
  );
});

async function checkMessagesInBackground() {
  const auth = await readConfig('auth');
  if (!auth?.token || !auth?.apiBase) return;

  const response = await fetch(`${auth.apiBase}/messages/unread-count`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    credentials: 'same-origin',
  }).catch(() => null);

  if (!response?.ok) return;

  const data = await response.json().catch(() => null);
  const count = Number(data?.count ?? 0);
  const prev = Number((await readConfig('unread'))?.count ?? 0);

  if (count <= prev) {
    await saveConfig('unread', { count });
    return;
  }

  await saveConfig('unread', { count });

  const visible = await hasVisibleClient();
  if (visible) return;

  await self.registration.showNotification('Новое сообщение', {
    body: count === 1 ? 'У вас 1 непрочитанное' : `У вас ${count} непрочитанных`,
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32.png',
    tag: 'nagaevo-unread-sync',
    renotify: true,
    silent: false,
    vibrate: [120, 60, 120],
    data: { url: '/profile?section=messages' },
  });
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data?.type) return;

  if (data.type === 'AUTH_SYNC') {
    event.waitUntil(
      saveConfig('auth', {
        token: data.token ?? null,
        apiBase: data.apiBase ?? '/api',
      }),
    );
    return;
  }

  if (data.type === 'REGISTER_BG_SYNC') {
    event.waitUntil(
      self.registration.sync?.register('check-messages').catch(() => undefined),
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'check-messages') {
    event.waitUntil(checkMessagesInBackground());
  }
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: SW_SUBSCRIPTION_CHANGE });
      });
    }),
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
