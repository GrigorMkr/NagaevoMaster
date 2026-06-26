import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { isNativeApp, isNativeAndroid, isNativeIos } from '@/utils/nativeApp';
import { writeStoredOAuthReturnPath } from '@/utils/nativeOAuthReturn';
import {
  completeOAuthLogin,
  getNativeOAuthSearchFromUrl,
  hasNativeOAuthParams,
  isOAuthReturnPath,
} from '@/services/completeOAuthLogin';
import { normalizeOAuthSearch, stashOAuthPending } from '@/utils/oauthPending';

const SITE_HOST = 'nagaevomaster.ru';
const NATIVE_SCHEME = 'ru.nagaevomaster.app';

const handledDeepLinkKeys = new Set<string>();

function isSameSiteUrl(url: URL): boolean {
  return url.hostname === SITE_HOST || url.hostname === `www.${SITE_HOST}`;
}

function isNativeOAuthUrl(url: URL): boolean {
  return url.protocol === `${NATIVE_SCHEME}:` && url.hostname === 'auth';
}

function isInternalAppPath(url: URL): boolean {
  return isNativeOAuthUrl(url) || isSameSiteUrl(url) || url.origin === window.location.origin;
}

function openNativeOAuthReturn(oauthSearch: string) {
  const suffix = normalizeOAuthSearch(oauthSearch);
  stashOAuthPending(suffix);
  const next = `/auth/app-return${suffix}`;
  if (`${window.location.pathname}${window.location.search}` === next) {
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    return;
  }
  window.history.pushState(window.history.state, '', next);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

async function finishNativeOAuthLogin(oauthSearch: string): Promise<boolean> {
  const result = await completeOAuthLogin(oauthSearch);
  if (result.status === 'success') {
    navigateInApp(result.returnPath);
    return true;
  }
  if (result.status === 'error') {
    navigateInApp('/auth', `?oauth_error=${encodeURIComponent(result.message)}`);
    return true;
  }
  if (result.status === 'pending') {
    return true;
  }
  return false;
}

function navigateInApp(pathname: string, search = '', hash = '') {
  const next = `${pathname}${search}${hash}`;
  if (isOAuthReturnPath(pathname) && hasNativeOAuthParams(search)) {
    openNativeOAuthReturn(search);
    return;
  }
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` === next) {
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    return;
  }
  window.history.pushState(window.history.state, '', next);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

async function openExternalInAppBrowser(url: string) {
  if (!Capacitor.isPluginAvailable('Browser')) {
    window.location.assign(url);
    return;
  }
  await Browser.open({ url });
}

async function openOAuthUrl(path: string) {
  const url = new URL(path, window.location.origin);
  if (isNativeApp()) {
    url.searchParams.set('native', '1');
    const returnPath = `${window.location.pathname}${window.location.search}`;
    if (returnPath.startsWith('/') && !returnPath.startsWith('//')) {
      writeStoredOAuthReturnPath(returnPath);
    }

    const isVkOAuth = url.pathname.endsWith('/auth/vk');
    if (isVkOAuth && isNativeApp()) {
      url.searchParams.set('delivery', 'webview');
      window.location.assign(url.href);
      return;
    }

    if (isNativeAndroid()) {
      url.searchParams.set('platform', 'android');
    }
    if (isNativeIos()) {
      url.searchParams.set('platform', 'ios');
    }

    await openExternalInAppBrowser(url.href);
    return;
  }
  window.location.assign(url.href);
}

function shouldLeaveToSystemBrowser(url: URL): boolean {
  return url.protocol === 'mailto:' || url.protocol === 'tel:';
}

function handleDocumentClick(event: MouseEvent) {
  if (!isNativeApp()) return;
  if (event.defaultPrevented) return;
  if (event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest('a[href]');
  if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
  if (anchor.hasAttribute('download')) return;

  const rawHref = anchor.getAttribute('href');
  if (!rawHref || rawHref.startsWith('#') || shouldLeaveToSystemBrowser(new URL(rawHref, window.location.href))) {
    return;
  }

  const url = new URL(anchor.href, window.location.href);

  if (anchor.getAttribute('target') === '_blank' || !isInternalAppPath(url)) {
    event.preventDefault();
    void openExternalInAppBrowser(url.href);
  }
}

function handleAppUrlOpen(incomingUrl: string) {
  let url: URL;
  try {
    url = new URL(incomingUrl);
  } catch {
    return;
  }

  if (!isInternalAppPath(url)) return;

  const nativeOAuthSearch = getNativeOAuthSearchFromUrl(url);
  const deepLinkKey = nativeOAuthSearch
    ?? (isOAuthReturnPath(url.pathname) && url.search ? url.search : null)
    ?? `${url.pathname}${url.search}${url.hash}`;
  if (handledDeepLinkKeys.has(deepLinkKey)) return;
  handledDeepLinkKeys.add(deepLinkKey);
  window.setTimeout(() => {
    handledDeepLinkKeys.delete(deepLinkKey);
  }, 15_000);

  void Browser.close().catch(() => undefined);

  if (nativeOAuthSearch && isNativeApp()) {
    void finishNativeOAuthLogin(nativeOAuthSearch).then((handled) => {
      if (!handled) {
        openNativeOAuthReturn(nativeOAuthSearch);
      }
    });
    return;
  }

  if (isNativeOAuthUrl(url)) {
    openNativeOAuthReturn(url.search);
    return;
  }

  if (isOAuthReturnPath(url.pathname) && url.search) {
    void finishNativeOAuthLogin(url.search).then((handled) => {
      if (!handled) {
        openNativeOAuthReturn(url.search);
      }
    });
    return;
  }

  handleInternalUrl(url);
}

function handleInternalUrl(url: URL) {
  if (isNativeOAuthUrl(url)) {
    openNativeOAuthReturn(url.search);
    return;
  }
  navigateInApp(url.pathname, url.search, url.hash);
}

function tryCompleteOAuthFromLocation() {
  if (!isNativeApp()) return;

  const search = window.location.search;
  if (!hasNativeOAuthParams(search)) {
    return;
  }

  void finishNativeOAuthLogin(search);
}

function installNativeNavigation() {
  if (!isNativeApp()) return () => undefined;

  document.documentElement.classList.add('native-app');
  document.addEventListener('click', handleDocumentClick, true);

  const appUrlListener = App.addListener('appUrlOpen', ({ url }) => {
    handleAppUrlOpen(url);
  });

  const backListener = App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
      return;
    }
    void App.minimizeApp();
  });

  const resumeListener = App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) return;
    tryCompleteOAuthFromLocation();
    void Browser.close().catch(() => undefined);
  });

  void App.getLaunchUrl().then((result) => {
    if (result?.url) {
      handleAppUrlOpen(result.url);
      return;
    }
    tryCompleteOAuthFromLocation();
  });

  tryCompleteOAuthFromLocation();

  return () => {
    document.documentElement.classList.remove('native-app');
    document.removeEventListener('click', handleDocumentClick, true);
    void appUrlListener.then((handle) => handle.remove());
    void backListener.then((handle) => handle.remove());
    void resumeListener.then((handle) => handle.remove());
  };
}

export {
  installNativeNavigation,
  openOAuthUrl,
  openExternalInAppBrowser,
  handleAppUrlOpen as handleNativeOAuthDeepLink,
};
