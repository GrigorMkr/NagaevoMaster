import { useEffect, useState } from 'react';
import { isNativeApp } from '@/utils/nativeApp';
import { isLowPowerDevice } from '@/utils/performanceProfile';

function applyPerformanceClasses(lowPower: boolean): void {
  document.documentElement.classList.toggle('low-power', lowPower);
  document.documentElement.classList.toggle('native-app', isNativeApp());
}

function usePerformanceProfile() {
  const [lowPower, setLowPower] = useState(() => isLowPowerDevice());

  useEffect(() => {
    const update = () => {
      const next = isLowPowerDevice();
      setLowPower(next);
      applyPerformanceClasses(next);
    };

    update();

    window.addEventListener('resize', update, { passive: true });

    if (typeof window.matchMedia === 'function') {
      const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const coarse = window.matchMedia('(pointer: coarse)');
      motion.addEventListener('change', update);
      coarse.addEventListener('change', update);

      return () => {
        window.removeEventListener('resize', update);
        motion.removeEventListener('change', update);
        coarse.removeEventListener('change', update);
      };
    }

    return () => {
      window.removeEventListener('resize', update);
    };
  }, []);

  return {
    lowPower,
    nativeApp: isNativeApp(),
  };
}

export {
  usePerformanceProfile,
  applyPerformanceClasses,
};
