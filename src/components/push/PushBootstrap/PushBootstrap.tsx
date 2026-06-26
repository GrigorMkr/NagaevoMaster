import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import {
  ensurePushNotifications,
  fetchPushStatus,
  installPushLifecycleSync,
  installPushMessageListener,
  registerBackgroundMessageSync,
  registerServiceWorker,
  syncAuthToServiceWorker,
} from '@/services/pushApi';
import { forceNativePushOnLaunch, flushPendingNativePushToken, checkNativePushPermission } from '@/services/nativePush';
import { unlockMessageSound } from '@/utils/messageSound';
import {
  isIosDevice,
  isPushApiAvailable,
  isStandalonePwa,
} from '@/utils/pushEnvironment';
import { isNativeApp } from '@/utils/nativeApp';
import { isPushEnabledPreference, setPushEnabledPreference } from '@/utils/pushPreferences';

function preloadMessageSound() {
  const unlock = () => {
    unlockMessageSound();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchstart', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });
}

function PushBootstrap() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isPushApiAvailable() && !isNativeApp()) return undefined;
    if (isPushApiAvailable()) {
      void registerServiceWorker();
      const removeMessages = installPushMessageListener();
      const removeSync = installPushLifecycleSync();
      preloadMessageSound();
      return () => {
        removeMessages();
        removeSync();
      };
    }
    preloadMessageSound();
    if (isNativeApp()) {
      window.setTimeout(() => unlockMessageSound(), 300);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    setPushEnabledPreference(true);
    void forceNativePushOnLaunch();

    return undefined;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      void syncAuthToServiceWorker();
      return;
    }

    void syncAuthToServiceWorker();
    void registerBackgroundMessageSync();

    if (isNativeApp()) {
      setPushEnabledPreference(true);
      void fetchPushStatus().catch(() => undefined);
      void (async () => {
        const permission = await checkNativePushPermission();
        const status = await fetchPushStatus().catch(() => null);
        const needsSubscribe = !status?.subscribed;
        await ensurePushNotifications({
          requestPermission: permission === 'prompt' || (permission === 'granted' && needsSubscribe),
          force: true,
        });
        await flushPendingNativePushToken().catch(() => undefined);
      })();
      return;
    }

    if (!isPushEnabledPreference()) {
      return;
    }

    void fetchPushStatus().catch(() => undefined);
    void ensurePushNotifications({ requestPermission: true });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isNativeApp() || !isAuthenticated) return undefined;

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) return;
      setPushEnabledPreference(true);
      void flushPendingNativePushToken();
      void ensurePushNotifications({ requestPermission: false, force: true });
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isIosDevice() || !isStandalonePwa()) return undefined;

    const syncIosPush = () => {
      if (!isPushEnabledPreference()) return;
      if (document.visibilityState === 'visible') {
        void ensurePushNotifications({ requestPermission: true });
      }
    };

    window.addEventListener('pageshow', syncIosPush);
    document.addEventListener('visibilitychange', syncIosPush);
    return () => {
      window.removeEventListener('pageshow', syncIosPush);
      document.removeEventListener('visibilitychange', syncIosPush);
    };
  }, [isAuthenticated]);

  return null;
}

export {
  PushBootstrap,
};
