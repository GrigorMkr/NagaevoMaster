import { registerPlugin } from '@capacitor/core';

interface RuStoreReviewPlugin {
  init(): Promise<void>;
  requestReviewFlow(): Promise<{ requested: boolean }>;
  launchReviewFlow(): Promise<void>;
}

const RuStoreReview = registerPlugin<RuStoreReviewPlugin>('RuStoreReview');

export {
  RuStoreReview,
};
