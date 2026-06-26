import { memo, useEffect } from 'react';
import mmrgl from 'mmr-gl';
import { GEO, MAP_BOUNDS_PADDING_PX } from '@/constants';
import type { Listing } from '@/types/listing';
import type { AccountLocation } from '@/types/location';
import { latLngBoundsToLngLatBounds, safeLatLngToLngLat } from '@/utils/mapBounds';
import { useVkMap } from '@/components/map/VkMap/VkMapContext';

interface FitListingsBoundsProps {
  listings: Listing[];
  userLocation?: AccountLocation | null;
  enabled?: boolean;
}

const FitListingsBounds = memo(function FitListingsBounds({
  listings,
  userLocation = null,
  enabled = true,
}: FitListingsBoundsProps) {
  const { map, mapLoaded } = useVkMap();

  useEffect(() => {
    if (!map || !mapLoaded || !enabled) {
      return;
    }

    const points: [number, number][] = [];
    listings.forEach((listing) => {
      const coords = safeLatLngToLngLat(listing.location?.lat, listing.location?.lng);
      if (coords) {
        points.push(coords);
      }
    });

    const userCoords = userLocation
      ? safeLatLngToLngLat(userLocation.lat, userLocation.lng)
      : null;
    if (userCoords) {
      points.push(userCoords);
    }

    if (points.length === 0) {
      map.fitBounds(latLngBoundsToLngLatBounds(GEO.mapBounds), {
        padding: MAP_BOUNDS_PADDING_PX,
        maxZoom: GEO.defaultZoom,
      });
      return;
    }

    const bounds = new mmrgl.LngLatBounds();
    points.forEach((coords) => bounds.extend(coords));

    map.fitBounds(bounds, {
      padding: MAP_BOUNDS_PADDING_PX,
      maxZoom: points.length === 1 ? 15 : GEO.defaultZoom + 1,
    });
  }, [enabled, listings, userLocation, map, mapLoaded]);

  return null;
});

export {
  FitListingsBounds,
};
