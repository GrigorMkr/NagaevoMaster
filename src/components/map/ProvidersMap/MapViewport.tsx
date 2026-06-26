import { memo, useEffect } from 'react';
import { GEO, MAP_BOUNDS_PADDING_PX } from '@/constants';
import { latLngBoundsToLngLatBounds } from '@/utils/mapBounds';
import { useVkMap } from '@/components/map/VkMap/VkMapContext';

const MapViewport = memo(function MapViewport() {
  const { map, mapLoaded } = useVkMap();

  useEffect(() => {
    if (!map || !mapLoaded) {
      return;
    }

    map.fitBounds(latLngBoundsToLngLatBounds(GEO.mapBounds), {
      padding: MAP_BOUNDS_PADDING_PX,
      maxZoom: GEO.defaultZoom,
    });
    map.setMaxBounds(latLngBoundsToLngLatBounds(GEO.mapBounds));
  }, [map, mapLoaded]);

  return null;
});

export {
  MapViewport,
};
