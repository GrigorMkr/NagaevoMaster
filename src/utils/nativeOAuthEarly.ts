import { App } from '@capacitor/app';
import { isNativeApp } from '@/utils/nativeApp';
import { handleNativeOAuthDeepLink } from '@/utils/nativeNavigation';

let registered = false;

function registerNativeOAuthEarlyHandler() {
  if (!isNativeApp() || registered) return;
  registered = true;

  void App.addListener('appUrlOpen', ({ url }) => {
    handleNativeOAuthDeepLink(url);
  });

  void App.getLaunchUrl().then((result) => {
    if (result?.url) {
      handleNativeOAuthDeepLink(result.url);
    }
  });
}

export {
  registerNativeOAuthEarlyHandler,
};
