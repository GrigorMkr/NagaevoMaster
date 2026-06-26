import { memo, useEffect } from 'react';
import mmrgl from 'mmr-gl';
import { GEO, NAGAEVO_STREETS } from '@/constants';
import { safeLatLngToLngLat } from '@/utils/mapBounds';
import { useVkMap } from '@/components/map/VkMap/VkMapContext';
import { createCenterMarkerElement } from './mapMarkers';

const SettlementMarker = memo(function SettlementMarker() {
  const { map, mapLoaded } = useVkMap();

  useEffect(() => {
    if (!map || !mapLoaded) {
      return;
    }

    const coords = safeLatLngToLngLat(NAGAEVO_STREETS.center.lat, NAGAEVO_STREETS.center.lng);
    if (!coords) {
      return;
    }

    const popup = new mmrgl.Popup({ closeButton: true, offset: 12 }).setHTML(
      `<strong>с. Нагаево</strong><br />${GEO.district}, ${GEO.region}`,
    );

    const marker = new mmrgl.Marker({ element: createCenterMarkerElement(), anchor: 'center' })
      .setLngLat(coords)
      .setPopup(popup)
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [map, mapLoaded]);

  return null;
});

export {
  SettlementMarker,
};
