import { Capacitor } from '@capacitor/core';
import { RuStoreReview } from '@/plugins/rustoreReview';
import { isNativeAndroid } from '@/utils/nativeApp';
import {
  markRuStoreReviewAttempt,
  markRuStoreReviewLaunched,
} from '@/utils/rustoreReviewStorage';

function isRuStoreReviewAvailable(): boolean {
  return isNativeAndroid() && Capacitor.isPluginAvailable('RuStoreReview');
}

async function initRuStoreReview(): Promise<void> {
  if (!isRuStoreReviewAvailable()) {
    return;
  }
  await RuStoreReview.init();
}

async function requestRuStoreReviewFlow(): Promise<boolean> {
  if (!isRuStoreReviewAvailable()) {
    return false;
  }
  try {
    const result = await RuStoreReview.requestReviewFlow();
    return result.requested;
  } catch {
    return false;
  }
}

async function launchRuStoreReviewFlow(): Promise<boolean> {
  if (!isRuStoreReviewAvailable()) {
    return false;
  }
  try {
    await RuStoreReview.launchReviewFlow();
    return true;
  } catch {
    return false;
  }
}

async function tryLaunchRuStoreReview(): Promise<boolean> {
  if (!isRuStoreReviewAvailable()) {
    return false;
  }

  markRuStoreReviewAttempt();

  const requested = await requestRuStoreReviewFlow();
  if (!requested) {
    return false;
  }

  const launched = await launchRuStoreReviewFlow();
  if (launched) {
    markRuStoreReviewLaunched();
  }
  return launched;
}

export {
  initRuStoreReview,
  isRuStoreReviewAvailable,
  launchRuStoreReviewFlow,
  requestRuStoreReviewFlow,
  tryLaunchRuStoreReview,
};
