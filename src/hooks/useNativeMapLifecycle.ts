import { useEffect } from 'react';
import { isNativeApp } from '@/utils/nativeApp';

function useNativeMapLifecycle(onResume: () => void): void {
  useEffect(() => {
    if (!isNativeApp()) {
      return undefined;
    }

    let removeListener: (() => void) | undefined;

    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          onResume();
        }
      }).then((handle) => {
        removeListener = () => handle.remove();
      });
    }).catch(() => undefined);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        onResume();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      removeListener?.();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [onResume]);
}

export {
  useNativeMapLifecycle,
};
