import { memo, useEffect } from 'react';
import { USER_LOCATION_AUTO_FLY_MAX_AGE_MS, USER_LOCATION_MAP_ZOOM } from '@/constants';
import type { AccountLocation } from '@/types/location';
import { safeLatLngToLngLat } from '@/utils/mapBounds';
import { useVkMap } from '@/components/map/VkMap/VkMapContext';

interface FlyToUserLocationProps {
  location: AccountLocation | null;
}

const FlyToUserLocation = memo(function FlyToUserLocation({ location }: FlyToUserLocationProps) {
  const { map, mapLoaded } = useVkMap();

  useEffect(() => {
    if (!map || !mapLoaded || !location) {
      return;
    }

    const coords = safeLatLngToLngLat(location.lat, location.lng);
    if (!coords) {
      return;
    }

    const ageMs = Date.now() - new Date(location.updatedAt).getTime();
    if (!Number.isFinite(ageMs) || ageMs > USER_LOCATION_AUTO_FLY_MAX_AGE_MS) {
      return;
    }

    map.flyTo({
      center: coords,
      zoom: USER_LOCATION_MAP_ZOOM,
      duration: 750,
    });
  }, [location?.lat, location?.lng, location?.updatedAt, map, mapLoaded]);

  return null;
});

export {
  FlyToUserLocation,
};
