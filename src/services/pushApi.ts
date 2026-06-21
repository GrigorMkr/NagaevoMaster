import { api } from './api';
import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { getSiteOrigin } from '@/utils/canonicalSite';
import { playMessageSound, unlockMessageSound } from '@/utils/messageSound';
import { tryClaimMessageNotice } from '@/utils/messageNotice';
import { setPushSubscribed } from '@/utils/pushSubscribed';
import { isPushEnabledPreference } from '@/utils/pushPreferences';
import { isNativeApp } from '@/utils/nativeApp';
import { ensureNativePushNotifications, unsubscribeNativePush } from '@/services/nativePush';
import { APP_VERSION, isPushEnvironmentReady } from '@/utils/pushEnvironment';

const SW_MESSAGE_TYPE = 'MESSAGE_PUSH';
const SW_SUBSCRIPTION_CHANGE = 'PUSH_SUBSCRIPTION_CHANGE';
const PUSH_CHANNEL = 'nagaevo-push';
const SW_URL = `/sw.js?v=${APP_VERSION}`;

const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '/api';

function handlePushSoundMessage(event: MessageEvent): void {
  if (event.data?.type !== SW_MESSAGE_TYPE) return;
  if (event.data?.playSound === false) return;

  const messageId = event.data?.payload?.messageId;
  if (typeof messageId === 'string' && !tryClaimMessageNotice(messageId)) {
    return;
  }

  void playMessageSound();
}

async function postToServiceWorker(data: Record<string, unknown>): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  registration?.active?.postMessage(data);
}

async function syncAuthToServiceWorker(): Promise<void> {
  if (!hasAuthToken()) {
    await postToServiceWorker({ type: 'AUTH_SYNC', token: null, apiBase: API_BASE_URL });
    return;
  }

  let token: string | null = null;
  try {
    token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    token = null;
  }

  await postToServiceWorker({
    type: 'AUTH_SYNC',
    token,
    apiBase: API_BASE_URL,
  });
}

async function registerBackgroundMessageSync(): Promise<void> {
  await postToServiceWorker({ type: 'REGISTER_BG_SYNC' });
}

function handleSubscriptionChange(event: MessageEvent): void {
  if (event.data?.type !== SW_SUBSCRIPTION_CHANGE) return;
  if (!hasAuthToken() || Notification.permission !== 'granted') return;
  void syncPushSubscription().catch(() => undefined);
}

function installPushMessageListener(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(PUSH_CHANNEL) : null;
  channel?.addEventListener('message', handlePushSoundMessage);
  navigator.serviceWorker?.addEventListener('message', handlePushSoundMessage);
  navigator.serviceWorker?.addEventListener('message', handleSubscriptionChange);

  return () => {
    channel?.removeEventListener('message', handlePushSoundMessage);
    channel?.close();
    navigator.serviceWorker?.removeEventListener('message', handlePushSoundMessage);
    navigator.serviceWorker?.removeEventListener('message', handleSubscriptionChange);
  };
}

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
  } catch {
    return false;
  }
}

function isPushSupported(): boolean {
  return isPushEnvironmentReady();
}

function canAttemptPushSubscribe(): boolean {
  return isPushEnvironmentReady();
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const response = await api.get<{ publicKey: string }>('/push/vapid-public-key');
    return response.data.publicKey;
  } catch {
    return null;
  }
}

async function fetchPushStatus(): Promise<{ configured: boolean; subscribed: boolean }> {
  const response = await api.get<{ configured: boolean; subscribed: boolean }>('/push/status');
  setPushSubscribed(response.data.subscribed);
  return response.data;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
    await registration.update().catch(() => undefined);
    return registration;
  } catch {
    return null;
  }
}

async function saveSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
  if (!hasAuthToken()) return false;
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  await api.post('/push/subscribe', {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    siteOrigin: getSiteOrigin(),
  });
  setPushSubscribed(true);
  await syncAuthToServiceWorker();
  await registerBackgroundMessageSync();
  return true;
}

async function subscribeToPush(): Promise<boolean> {
  if (!isPushEnabledPreference()) return false;
  if (!canAttemptPushSubscribe()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  unlockMessageSound();

  const registration = await registerServiceWorker();
  if (!registration) return false;

  await navigator.serviceWorker.ready;

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return false;

  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  return saveSubscriptionToServer(subscription);
}

async function syncPushSubscription(): Promise<boolean> {
  if (!isPushEnabledPreference()) return false;
  if (!canAttemptPushSubscribe() || Notification.permission !== 'granted' || !hasAuthToken()) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (!registration) return false;

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return false;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  return saveSubscriptionToServer(subscription);
}

async function unsubscribeFromPush(): Promise<void> {
  if (isNativeApp()) {
    await unsubscribeNativePush();
    return;
  }
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await api.delete('/push/subscribe', { data: { endpoint } });
  setPushSubscribed(false);
}

function installPushLifecycleSync(): () => void {
  const sync = () => {
    void syncAuthToServiceWorker().catch(() => undefined);
    if (!hasAuthToken()) return;
    if (Notification.permission === 'granted') {
      void syncPushSubscription().catch(() => undefined);
    }
  };

  window.addEventListener('focus', sync);
  document.addEventListener('visibilitychange', () => {
    sync();
  });

  return () => {
    window.removeEventListener('focus', sync);
  };
}

async function ensurePushNotifications(options?: { requestPermission?: boolean }): Promise<boolean> {
  if (!hasAuthToken()) return false;

  if (!isPushEnabledPreference()) {
    await unsubscribeFromPush().catch(() => undefined);
    await unsubscribeNativePush().catch(() => undefined);
    return false;
  }

  if (isNativeApp()) {
    return ensureNativePushNotifications(options);
  }

  if (!canAttemptPushSubscribe()) return false;

  const registration = await registerServiceWorker();
  if (!registration) return false;

  const status = await fetchPushStatus().catch(() => null);
  if (!status?.configured) return false;

  if (Notification.permission === 'granted') {
    return syncPushSubscription();
  }

  const shouldRequest = options?.requestPermission ?? isPushEnabledPreference();
  if (Notification.permission === 'default' && shouldRequest) {
    return subscribeToPush();
  }

  return false;
}

export {
  isPushSupported,
  canAttemptPushSubscribe,
  fetchPushStatus,
  subscribeToPush,
  syncPushSubscription,
  unsubscribeFromPush,
  registerServiceWorker,
  installPushMessageListener,
  installPushLifecycleSync,
  ensurePushNotifications,
  syncAuthToServiceWorker,
  registerBackgroundMessageSync,
};
