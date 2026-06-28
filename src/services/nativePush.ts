import { Capacitor } from '@capacitor/core';
import { api } from './api';
import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { isNativeApp } from '@/utils/nativeApp';
import { setPushSubscribed } from '@/utils/pushSubscribed';
import { isPushEnabledPreference, setPushEnabledPreference } from '@/utils/pushPreferences';
import { playMessageSound } from '@/utils/messageSound';
import { tryClaimMessageNotice } from '@/utils/messageNotice';
import { showMessageLightning } from '@/utils/messageLightningToast';
import {
  addRuStorePushListeners,
  checkRuStorePushAvailability,
  deleteRuStorePushToken,
  fetchRuStorePushTokens,
  isRuStorePushAvailable,
  type RemoteMessage,
} from '@/services/rustorePush';

const FCM_PROVIDER = 'firebase';
const FCM_ENDPOINT_PREFIX = 'fcm:';
const RUSTORE_ENDPOINT_PREFIX = 'rustore:';
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
let pendingNativeTokenPrefix = FCM_ENDPOINT_PREFIX;
let nativePushInitialized = false;
let rustorePushListenersInitialized = false;
let lastRegistrationError: string | null = null;
let pendingRegistration: PendingRegistration | null = null;

async function savePushToken(token: string, prefix: string): Promise<boolean> {
  if (!hasAuthToken()) {
    pendingNativeToken = token;
    pendingNativeTokenPrefix = prefix;
    return false;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= SUBSCRIBE_RETRIES; attempt += 1) {
    try {
      await api.post('/push/subscribe', {
        endpoint: `${prefix}${token}`,
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

  console.error('[push] failed to save push token:', lastError);
  pendingNativeToken = token;
  pendingNativeTokenPrefix = prefix;
  return false;
}

async function flushPendingNativePushToken(): Promise<boolean> {
  if (!pendingNativeToken || !hasAuthToken()) {
    return false;
  }

  return savePushToken(pendingNativeToken, pendingNativeTokenPrefix);
}

function navigateFromPushData(data?: Record<string, string>) {
  const url = data?.url;
  if (!url) return;
  const target = url.startsWith('/') ? url : `/${url}`;
  window.history.pushState(window.history.state, '', target);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

function handleForegroundNotification(notification: {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}) {
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

function handleRuStoreRemoteMessage(message: RemoteMessage) {
  const data = message.data ?? {};
  handleForegroundNotification({
    title: message.notification?.title ?? data.title,
    body: message.notification?.body ?? data.message ?? data.body,
    data,
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

function tokenPrefixForProvider(provider?: string): string {
  if (provider === FCM_PROVIDER) {
    return FCM_ENDPOINT_PREFIX;
  }
  return RUSTORE_ENDPOINT_PREFIX;
}

function initRuStorePushBridge() {
  if (rustorePushListenersInitialized || !isRuStorePushAvailable()) {
    return;
  }

  rustorePushListenersInitialized = true;
  addRuStorePushListeners({
    onNewToken: (token, provider) => {
      void savePushToken(token, tokenPrefixForProvider(provider));
    },
    onMessageReceived: handleRuStoreRemoteMessage,
    onError: (errors, provider) => {
      const label = provider ? `${provider}: ` : '';
      console.warn('[push] Universal Push SDK error:', `${label}${errors.join('; ')}`);
    },
  });
}

async function initNativePushListeners(PushNotifications: PushNotificationsPlugin): Promise<void> {
  if (nativePushInitialized) {
    return;
  }

  nativePushInitialized = true;
  initRuStorePushBridge();

  await PushNotifications.addListener('registration', (event) => {
    lastRegistrationError = null;
    settlePendingRegistration(event.value);
    void savePushToken(event.value, FCM_ENDPOINT_PREFIX);
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

async function registerUniversalPushTokens(): Promise<boolean> {
  if (!isRuStorePushAvailable()) {
    return false;
  }

  initRuStorePushBridge();
  const availability = await checkRuStorePushAvailability();
  if (!availability.available) {
    return false;
  }

  const tokens = await fetchRuStorePushTokens();
  if (!tokens) {
    return false;
  }

  let saved = false;
  if (tokens.rustore) {
    saved = await savePushToken(tokens.rustore, RUSTORE_ENDPOINT_PREFIX) || saved;
  }
  if (tokens.firebase) {
    saved = await savePushToken(tokens.firebase, FCM_ENDPOINT_PREFIX) || saved;
  }
  if (!saved && tokens.token) {
    saved = await savePushToken(
      tokens.token,
      availability.rustore ? RUSTORE_ENDPOINT_PREFIX : FCM_ENDPOINT_PREFIX,
    );
  }

  return saved;
}

async function registerFcmPushToken(PushNotifications: PushNotificationsPlugin): Promise<boolean> {
  try {
    const registrationPromise = waitForNativeRegistration();
    await PushNotifications.register();
    const token = await registrationPromise;
    return savePushToken(token, FCM_ENDPOINT_PREFIX);
  } catch (error) {
    if (error instanceof Error && error.message !== 'FCM registration timeout') {
      console.error('[push] FCM register failed:', error.message);
    }
    return false;
  }
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
    console.warn('[push] PushNotifications plugin unavailable — пересоберите APK');
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

  if (isRuStorePushAvailable()) {
    const universalRegistered = await registerUniversalPushTokens();
    if (universalRegistered) {
      return true;
    }
  }

  const fcmRegistered = await registerFcmPushToken(PushNotifications);
  if (fcmRegistered) {
    return true;
  }

  return flushPendingNativePushToken().catch(() => false);
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
  await deleteRuStorePushToken().catch(() => undefined);
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
  RUSTORE_ENDPOINT_PREFIX,
};

export type {
  NativePushPermission,
};
