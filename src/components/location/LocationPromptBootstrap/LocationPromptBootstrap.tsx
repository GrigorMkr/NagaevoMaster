import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { LocationPromptDialog } from '@/components/location/LocationPromptDialog/LocationPromptDialog';
import {
  clearLocationPromptFlag,
  consumePendingSearchQuery,
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
    if (isAuthLoading || !isAuthenticated || accountLocation) {
      setOpen(false);
      return;
    }
    if (shouldShowLocationPrompt()) {
      setOpen(true);
    }
  }, [isAuthLoading, isAuthenticated, accountLocation]);

  const handleDecline = useCallback(() => {
    clearLocationPromptFlag();
    setOpen(false);
  }, []);

  const handleAccept = useCallback(async () => {
    const location = await detectLocationAsync();
    clearLocationPromptFlag();
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
}
