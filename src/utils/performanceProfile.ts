import { isNativeApp } from '@/utils/nativeApp';

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isCoarsePointer(): boolean {
  if (typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(pointer: coarse)').matches;
}

function isNarrowViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth <= 768;
}

/** Native shell и слабые touch-устройства — без тяжёлых анимаций. */
function isLowPowerDevice(): boolean {
  if (isNativeApp()) {
    return true;
  }

  if (prefersReducedMotion()) {
    return true;
  }

  return isCoarsePointer() && isNarrowViewport();
}

export {
  isCoarsePointer,
  isLowPowerDevice,
  isNarrowViewport,
  prefersReducedMotion,
};
