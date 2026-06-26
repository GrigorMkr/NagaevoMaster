import { Capacitor } from '@capacitor/core';
import { api } from './api';
import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { isNativeApp } from '@/utils/nativeApp';
import { setPushSubscribed } from '@/utils/pushSubscribed';
import { isPushEnabledPreference, setPushEnabledPreference } from '@/utils/pushPreferences';
import { playMessageSound } from '@/utils/messageSound';
import { tryClaimMessageNotice } from '@/utils/messageNotice';
import { showMessageLightning } from '@/utils/messageLightningToast';

const FCM_ENDPOINT_PREFIX = 'fcm:';
const REGISTRATION_TIMEOUT_MS = 20_000;
const SUBSCRIBE_RETRIES = 3;

type NativePushPermission = 'granted' | 'denied' | 'prompt';

type PushNotificationsPlugin = NonNullable<Awaited<ReturnType<typeof getPushNotificationsModule>>>;

type PendingRegistration = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

async function getPushNotificationsModule() {
  if (!Capacitor.isPluginAvailable('PushNotifications')) return null;
  try {
    const mod = await import('@capacitor/push-notifications');
    return mod.PushNotifications;
  } catch {
    return null;
  }
}

function hasAuthToken(): boolean {
  try {
    return Boolean(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
  } catch {
    return false;
  }
}

function mapPermissionState(receive: string): NativePushPermission {
  if (receive === 'granted') return 'granted';
  if (receive === 'denied') return 'denied';
  return 'prompt';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let pendingNativeToken: string | null = null;
let nativePushInitialized = false;
let lastRegistrationError: string | null = null;
let pendingRegistration: PendingRegistration | null = null;

async function saveNativeToken(token: string): Promise<boolean> {
  if (!hasAuthToken()) {
    pendingNativeToken = token;
    return false;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= SUBSCRIBE_RETRIES; attempt += 1) {
    try {
      await api.post('/push/subscribe', {
        endpoint: `${FCM_ENDPOINT_PREFIX}${token}`,
        keys: {
          p256dh: 'native',
          auth: Capacitor.getPlatform(),
        },
      });
      setPushSubscribed(true);
      pendingNativeToken = null;
      return true;
    } catch (error) {
      lastError = error;
      if (attempt < SUBSCRIBE_RETRIES) {
        await sleep(attempt * 500);
      }
    }
  }

  console.error('[push] failed to save FCM token:', lastError);
  pendingNativeToken = token;
  return false;
}

async function flushPendingNativePushToken(): Promise<boolean> {
  if (!pendingNativeToken || !hasAuthToken()) {
    return false;
  }

  return saveNativeToken(pendingNativeToken);
}

function navigateFromPushData(data?: Record<string, string>) {
  const url = data?.url;
  if (!url) return;
  const target = url.startsWith('/') ? url : `/${url}`;
  window.history.pushState(window.history.state, '', target);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

function handleForegroundNotification(notification: { title?: string; body?: string; data?: Record<string, string> }) {
  const messageId = notification.data?.messageId;
  if (typeof messageId === 'string' && !tryClaimMessageNotice(messageId)) {
    return;
  }
  void playMessageSound();
  showMessageLightning({
    senderName: notification.data?.senderName ?? notification.title ?? 'Новое сообщение',
    preview: notification.body ?? 'Откройте переписку',
  });
}

function settlePendingRegistration(token: string) {
  pendingRegistration?.resolve(token);
  pendingRegistration = null;
}

function rejectPendingRegistration(message: string) {
  pendingRegistration?.reject(new Error(message));
  pendingRegistration = null;
}

function waitForNativeRegistration(): Promise<string> {
  return new Promise((resolve, reject) => {
    pendingRegistration = { resolve, reject };
    window.setTimeout(() => {
      if (!pendingRegistration) return;
      rejectPendingRegistration('FCM registration timeout');
    }, REGISTRATION_TIMEOUT_MS);
  });
}

async function initNativePushListeners(PushNotifications: PushNotificationsPlugin): Promise<void> {
  if (nativePushInitialized) {
    return;
  }

  nativePushInitialized = true;

  await PushNotifications.addListener('registration', (event) => {
    lastRegistrationError = null;
    settlePendingRegistration(event.value);
    void saveNativeToken(event.value).catch(() => undefined);
  });

  await PushNotifications.addListener('registrationError', (event) => {
    nativePushInitialized = false;
    lastRegistrationError = event.error ?? 'Не удалось зарегистрировать push-токен';
    console.error('[push] registration error:', lastRegistrationError);
    rejectPendingRegistration(lastRegistrationError);
  });

  await PushNotifications.addListener('pushNotificationReceived', (event) => {
    handleForegroundNotification(event);
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    navigateFromPushData(event.notification.data as Record<string, string> | undefined);
  });
}

async function checkNativePushPermission(): Promise<NativePushPermission | null> {
  if (!isNativeApp()) return null;

  const PushNotifications = await getPushNotificationsModule();
  if (!PushNotifications) return null;

  const permission = await PushNotifications.checkPermissions();
  return mapPermissionState(permission.receive);
}

async function ensureNativePushNotifications(options?: {
  requestPermission?: boolean;
  force?: boolean;
}): Promise<boolean> {
  if (!isNativeApp()) return false;

  const force = options?.force ?? false;
  if (!force) {
    if (!hasAuthToken()) return false;
    if (!isPushEnabledPreference()) return false;
  }

  const PushNotifications = await getPushNotificationsModule();
  if (!PushNotifications) {
    console.warn('[push] PushNotifications plugin unavailable — пересоберите APK с Firebase');
    return false;
  }

  await initNativePushListeners(PushNotifications);

  let permission = await PushNotifications.checkPermissions();

  if (permission.receive !== 'granted') {
    const shouldRequest = options?.requestPermission ?? true;
    if (!shouldRequest || permission.receive === 'denied') {
      return false;
    }

    permission = await PushNotifications.requestPermissions();
  }

  if (permission.receive !== 'granted') {
    return false;
  }

  try {
    const registrationPromise = waitForNativeRegistration();
    await PushNotifications.register();
    const token = await registrationPromise;
    return saveNativeToken(token);
  } catch (error) {
    const flushed = await flushPendingNativePushToken().catch(() => false);
    if (flushed) {
      return true;
    }
    if (error instanceof Error && error.message !== 'FCM registration timeout') {
      console.error('[push] register failed:', error.message);
    }
    return false;
  }
}

async function forceNativePushOnLaunch(): Promise<void> {
  if (!isNativeApp()) return;

  setPushEnabledPreference(true);
  await ensureNativePushNotifications({ requestPermission: false, force: true });
}

async function unsubscribeNativePush(): Promise<void> {
  if (!isNativeApp()) return;
  setPushSubscribed(false);
  pendingNativeToken = null;
}

function getLastNativePushRegistrationError(): string | null {
  return lastRegistrationError;
}

export {
  ensureNativePushNotifications,
  checkNativePushPermission,
  flushPendingNativePushToken,
  forceNativePushOnLaunch,
  unsubscribeNativePush,
  getLastNativePushRegistrationError,
  FCM_ENDPOINT_PREFIX,
};

export type {
  NativePushPermission,
};
