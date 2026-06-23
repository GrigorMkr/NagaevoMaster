import { useEffect } from 'react';
import { dismissBootSplash, markBootSplashStarted } from '@/utils/bootSplash';

function BootSplashDismiss() {
  useEffect(() => {
    markBootSplashStarted();

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        dismissBootSplash();
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

export {
  BootSplashDismiss,
};
