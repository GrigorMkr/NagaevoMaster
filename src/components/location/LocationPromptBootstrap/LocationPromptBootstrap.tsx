import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { LocationPromptDialog } from '@/components/location/LocationPromptDialog/LocationPromptDialog';
import { LOCATION_REMINDER_MS } from '@/constants';
import {
  consumePendingSearchQuery,
  getLocationConsent,
  hasLocationConsentAccepted,
  hasLocationConsentDeclined,
  setLocationConsentAccepted,
  setLocationConsentDeclined,
  shouldShowLocationPrompt,
} from '@/constants/user-location';
import { GEO, searchPath } from '@/constants';
import { SortBy } from '@/enums/sort';
import { selectAuthLoading, selectIsAuthenticated } from '@/features/user/userSelectors';
import { useAccountLocation } from '@/hooks/useAccountLocation';

function LocationPromptBootstrap() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const accountLocation = useAppSelector((state) => state.user.accountLocation);
  const { detectLocationAsync, isLocating } = useAccountLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      setOpen(false);
      return;
    }

    if (hasLocationConsentAccepted()) {
      if (!accountLocation) {
        void detectLocationAsync({ silent: true });
      }
      setOpen(false);
      return;
    }

    if (shouldShowLocationPrompt() && getLocationConsent() === null) {
      setOpen(true);
      return;
    }

    setOpen(false);
  }, [isAuthLoading, isAuthenticated, accountLocation, detectLocationAsync]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || accountLocation || !hasLocationConsentDeclined()) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (!accountLocation) {
        setOpen(true);
      }
    }, LOCATION_REMINDER_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [isAuthLoading, isAuthenticated, accountLocation]);

  const handleDecline = useCallback(() => {
    setLocationConsentDeclined();
    setOpen(false);
  }, []);

  const handleAccept = useCallback(async () => {
    setLocationConsentAccepted();
    const location = await detectLocationAsync({ silent: true });
    setOpen(false);
    if (!location) {
      return;
    }
    const pendingQuery = consumePendingSearchQuery();
    const searchFilters = {
      sortBy: SortBy.Distance,
      distance: GEO.radiusKm,
    };
    navigate(searchPath(pendingQuery ?? undefined, searchFilters));
  }, [detectLocationAsync, navigate]);

  return (
    <LocationPromptDialog
      open={open}
      loading={isLocating}
      onAccept={() => void handleAccept()}
      onDecline={handleDecline}
    />
  );
}

export {
  LocationPromptBootstrap,
};
