import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectAuthLoading, selectIsAuthenticated } from '@/features/user/userSelectors';
import {
  ACTIVITY_DELAY_MS,
  canAttemptRuStoreReview,
  registerRuStoreReviewSession,
} from '@/utils/rustoreReviewStorage';
import {
  initRuStoreReview,
  isRuStoreReviewAvailable,
  tryLaunchRuStoreReview,
} from '@/services/rustoreReview';

function RuStoreReviewBootstrap() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isRuStoreReviewAvailable()) {
      return undefined;
    }

    void initRuStoreReview();
    registerRuStoreReviewSession();
    return undefined;
  }, []);

  useEffect(() => {
    if (!isRuStoreReviewAvailable() || isAuthLoading || !isAuthenticated || attemptedRef.current) {
      return undefined;
    }

    if (!canAttemptRuStoreReview()) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (attemptedRef.current || !canAttemptRuStoreReview()) {
        return;
      }
      attemptedRef.current = true;
      void tryLaunchRuStoreReview();
    }, ACTIVITY_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAuthLoading, isAuthenticated]);

  return null;
}

export {
  RuStoreReviewBootstrap,
};
