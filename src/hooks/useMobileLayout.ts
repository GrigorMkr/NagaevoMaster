import { useEffect, useState } from 'react';
import { isNativeApp } from '@/utils/nativeApp';
import { isNarrowViewport } from '@/utils/performanceProfile';

function shouldUseMobileLayout(): boolean {
  return isNativeApp() || isNarrowViewport();
}

function useMobileLayout(): boolean {
  const [mobileLayout, setMobileLayout] = useState(shouldUseMobileLayout);

  useEffect(() => {
    const update = () => setMobileLayout(shouldUseMobileLayout());
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return mobileLayout;
}

export {
  useMobileLayout,
  shouldUseMobileLayout,
};
