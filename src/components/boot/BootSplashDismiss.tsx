import { useEffect } from 'react';
import {
  markBootAppReady,
  markBootWindowLoaded,
} from '@/utils/bootSplash';
import {
  preloadAppContent,
  waitForNextPaint,
  waitForWindowLoad,
} from '@/utils/preloadAppContent';

function BootSplashDismiss() {
  useEffect(() => {
    let cancelled = false;

    void waitForWindowLoad().then(() => {
      if (!cancelled) {
        markBootWindowLoaded();
      }
    });

    void (async () => {
      await preloadAppContent();
      await waitForNextPaint();
      if (!cancelled) {
        markBootAppReady();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export {
  BootSplashDismiss,
};
