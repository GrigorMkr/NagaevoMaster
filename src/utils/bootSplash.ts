const BOOT_SPLASH_MIN_MS = 700;
const BOOT_SPLASH_MAX_MS = 12000;

let dismissStarted = false;
let dismissCallbacks: Array<() => void> = [];

function onBootSplashDismissed(callback: () => void) {
  dismissCallbacks.push(callback);
}

function runDismissCallbacks() {
  const callbacks = dismissCallbacks;
  dismissCallbacks = [];
  callbacks.forEach((callback) => {
    try {
      callback();
    } catch {
      // ignore
    }
  });
}

function dismissBootSplash() {
  if (typeof document === 'undefined' || dismissStarted) {
    return;
  }

  dismissStarted = true;
  const root = document.documentElement;
  if (!root.classList.contains('boot-splash-active')) {
    runDismissCallbacks();
    return;
  }

  const startedAt = Number(root.dataset.bootSplashStartedAt || Date.now());
  const elapsed = Date.now() - startedAt;
  const wait = Math.max(0, BOOT_SPLASH_MIN_MS - elapsed);

  window.setTimeout(() => {
    root.classList.add('boot-splash-done');
    const splash = document.getElementById('boot-splash');
    if (splash) {
      window.setTimeout(() => {
        splash.remove();
      }, 480);
    }
    runDismissCallbacks();
  }, wait);

  window.setTimeout(() => {
    if (!root.classList.contains('boot-splash-done')) {
      root.classList.add('boot-splash-done');
      document.getElementById('boot-splash')?.remove();
      runDismissCallbacks();
    }
  }, BOOT_SPLASH_MAX_MS);
}

function markBootSplashStarted() {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.dataset.bootSplashStartedAt = String(Date.now());
}

export {
  dismissBootSplash,
  markBootSplashStarted,
  onBootSplashDismissed,
};
