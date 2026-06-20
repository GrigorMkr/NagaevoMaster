import { memo, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { GEO } from '@/constants';
import type { AccountLocation } from '@/types/location';

interface FlyToUserLocationProps {
  location: AccountLocation | null;
}

const FlyToUserLocation = memo(function FlyToUserLocation({ location }: FlyToUserLocationProps) {
  const map = useMap();

  useEffect(() => {
    if (!location) {
      return;
    }
    map.setView([location.lat, location.lng], GEO.defaultZoom, { animate: true });
  }, [location, map]);

  return null;
});

export {
  FlyToUserLocation,
}
