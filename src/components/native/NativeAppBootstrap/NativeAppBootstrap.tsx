import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativeAndroid, isNativeApp } from '@/utils/nativeApp';
import { onBootSplashDismissed } from '@/utils/bootSplash';
import { useNativeOAuthCompletion } from '@/hooks/useNativeOAuthCompletion';

function NativeAppBootstrap() {
  useNativeOAuthCompletion();

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    const hideNativeSplash = async () => {
      try {
        if (Capacitor.isPluginAvailable('SplashScreen')) {
          await SplashScreen.hide();
        }
      } catch {
        // ignore
      }
    };

    onBootSplashDismissed(() => {
      void hideNativeSplash();
    });

    const fallbackTimer = window.setTimeout(() => {
      void hideNativeSplash();
    }, 4000);

    const init = async () => {
      try {
        if (Capacitor.isPluginAvailable('StatusBar')) {
          if (isNativeAndroid()) {
            await StatusBar.setOverlaysWebView({ overlay: false });
          }
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#081f18' });
        }
      } catch {
        // ignore on web preview
      }
    };

    void init();

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return null;
}

export {
  NativeAppBootstrap,
};
