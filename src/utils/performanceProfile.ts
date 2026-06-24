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

/** Телефоны в браузере и узкие touch-экраны (не Capacitor). */
function isLowPowerDevice(): boolean {
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
