import { Capacitor } from '@capacitor/core';
import { api } from './api';
import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/auth';
import { isNativeApp } from '@/utils/nativeApp';
import { setPushSubscribed } from '@/utils/pushSubscribed';
import { isPushEnabledPreference } from '@/utils/pushPreferences';
import { playMessageSound } from '@/utils/messageSound';
import { tryClaimMessageNotice } from '@/utils/messageNotice';

const FCM_ENDPOINT_PREFIX = 'fcm:';

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

async function saveNativeToken(token: string): Promise<boolean> {
  if (!hasAuthToken()) return false;

  await api.post('/push/subscribe', {
    endpoint: `${FCM_ENDPOINT_PREFIX}${token}`,
    keys: {
      p256dh: 'native',
      auth: Capacitor.getPlatform(),
    },
  });
  setPushSubscribed(true);
  return true;
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
}

let nativePushInitialized = false;

async function ensureNativePushNotifications(options?: { requestPermission?: boolean }): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (!hasAuthToken()) return false;
  if (!isPushEnabledPreference()) return false;

  const PushNotifications = await getPushNotificationsModule();
  if (!PushNotifications) return false;

  if (!nativePushInitialized) {
    nativePushInitialized = true;

    await PushNotifications.addListener('registration', (event) => {
      void saveNativeToken(event.value).catch(() => undefined);
    });

    await PushNotifications.addListener('registrationError', () => {
      nativePushInitialized = false;
    });

    await PushNotifications.addListener('pushNotificationReceived', (event) => {
      handleForegroundNotification(event);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      navigateFromPushData(event.notification.data as Record<string, string> | undefined);
    });
  }

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === 'prompt' && (options?.requestPermission ?? true)) {
    permission = await PushNotifications.requestPermissions();
  }

  if (permission.receive !== 'granted') {
    return false;
  }

  await PushNotifications.register();
  return true;
}

async function unsubscribeNativePush(): Promise<void> {
  if (!isNativeApp()) return;
  const PushNotifications = await getPushNotificationsModule();
  if (!PushNotifications) return;
  setPushSubscribed(false);
}

export {
  ensureNativePushNotifications,
  unsubscribeNativePush,
  FCM_ENDPOINT_PREFIX,
};
