import { Capacitor } from '@capacitor/core';
import {
  PushEvents,
  RuStorePush,
  type PushAvailability,
  type PushTokens,
  type RemoteMessage,
} from '@/plugins/rustorePush';
import { isNativeAndroid } from '@/utils/nativeApp';

function isRuStorePushAvailable(): boolean {
  return isNativeAndroid() && Capacitor.isPluginAvailable('RuStorePush');
}

async function checkRuStorePushAvailability(): Promise<PushAvailability> {
  if (!isRuStorePushAvailable()) {
    return { available: false };
  }
  try {
    return await RuStorePush.checkPushAvailability();
  } catch {
    return { available: false };
  }
}

async function fetchRuStorePushTokens(): Promise<PushTokens | null> {
  if (!isRuStorePushAvailable()) {
    return null;
  }
  try {
    return await RuStorePush.getToken();
  } catch {
    return null;
  }
}

async function fetchRuStorePushToken(): Promise<string | null> {
  const tokens = await fetchRuStorePushTokens();
  if (!tokens) {
    return null;
  }
  return tokens.token || tokens.rustore || tokens.firebase || null;
}

async function deleteRuStorePushToken(): Promise<boolean> {
  if (!isRuStorePushAvailable()) {
    return false;
  }
  try {
    await RuStorePush.deleteToken();
    return true;
  } catch {
    return false;
  }
}

function addRuStorePushListeners(handlers: {
  onNewToken?: (token: string, provider?: string) => void;
  onMessageReceived?: (message: RemoteMessage) => void;
  onDeletedMessages?: (provider?: string) => void;
  onError?: (errors: string[], provider?: string) => void;
}): () => void {
  if (!isRuStorePushAvailable()) {
    return () => undefined;
  }

  const removers: Array<() => void> = [];

  if (handlers.onNewToken) {
    void RuStorePush.addListener(PushEvents.OnNewToken, (payload) => {
      const data = payload as { token?: string; provider?: string };
      if (data.token) {
        handlers.onNewToken?.(data.token, data.provider);
      }
    }).then((handle) => {
      removers.push(() => handle.remove());
    });
  }

  if (handlers.onMessageReceived) {
    void RuStorePush.addListener(PushEvents.OnMessageReceived, (payload) => {
      handlers.onMessageReceived?.(payload as RemoteMessage);
    }).then((handle) => {
      removers.push(() => handle.remove());
    });
  }

  if (handlers.onDeletedMessages) {
    void RuStorePush.addListener(PushEvents.OnDeletedMessages, (payload) => {
      const provider = (payload as { provider?: string })?.provider;
      handlers.onDeletedMessages?.(provider);
    }).then((handle) => {
      removers.push(() => handle.remove());
    });
  }

  if (handlers.onError) {
    void RuStorePush.addListener(PushEvents.OnError, (payload) => {
      const data = payload as { errors?: string[]; provider?: string };
      handlers.onError?.(data.errors ?? [], data.provider);
    }).then((handle) => {
      removers.push(() => handle.remove());
    });
  }

  return () => {
    removers.forEach((remove) => remove());
  };
}

export {
  addRuStorePushListeners,
  checkRuStorePushAvailability,
  deleteRuStorePushToken,
  fetchRuStorePushToken,
  fetchRuStorePushTokens,
  isRuStorePushAvailable,
};

export type {
  PushAvailability,
  PushTokens,
  RemoteMessage,
};
