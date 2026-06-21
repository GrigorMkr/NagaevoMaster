const APP_VERSION = '0.0.10';

import { isNativeApp, isNativeIos } from '@/utils/nativeApp';

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  if (isNativeApp()) return true;
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isWebkit = /webkit/i.test(ua);
  const isChrome = /crios/i.test(ua);
  const isFirefox = /fxios/i.test(ua);
  const isEdge = /edgios/i.test(ua);
  return isIOS && isWebkit && !isChrome && !isFirefox && !isEdge;
}

function isPushApiAvailable(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

function needsIosPwaInstall(): boolean {
  if (isNativeIos()) return false;
  return isIosDevice() && !isStandalonePwa();
}

function isPushEnvironmentReady(): boolean {
  if (isNativeApp()) return true;
  if (!isPushApiAvailable()) return false;
  if (needsIosPwaInstall()) return false;
  return true;
}

function canAttemptPushSubscribe(): boolean {
  return isPushEnvironmentReady();
}

export {
  APP_VERSION,
  isIosDevice,
  isAndroidDevice,
  isStandalonePwa,
  isIosSafari,
  isPushApiAvailable,
  needsIosPwaInstall,
  isPushEnvironmentReady,
  canAttemptPushSubscribe,
};
