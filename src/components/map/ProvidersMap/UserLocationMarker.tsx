import { memo, useEffect, useRef } from 'react';
import mmrgl from 'mmr-gl';
import type { AccountLocation } from '@/types/location';
import { safeLatLngToLngLat } from '@/utils/mapBounds';
import { useVkMap } from '@/components/map/VkMap/VkMapContext';
import { createUserLocationElement } from './mapMarkers';

interface UserLocationMarkerProps {
  location: AccountLocation;
}

const UserLocationMarker = memo(function UserLocationMarker({ location }: UserLocationMarkerProps) {
  const { map, mapLoaded } = useVkMap();
  const markerRef = useRef<mmrgl.Marker | null>(null);
  const popupRef = useRef<mmrgl.Popup | null>(null);

  useEffect(() => {
    if (!map || !mapLoaded) {
      return;
    }

    const coords = safeLatLngToLngLat(location.lat, location.lng);
    if (!coords) {
      return;
    }

    const popup = new mmrgl.Popup({ closeButton: true, offset: 12 });
    const marker = new mmrgl.Marker({ element: createUserLocationElement(), anchor: 'center' })
      .setPopup(popup)
      .setLngLat(coords)
      .addTo(map);
    markerRef.current = marker;
    popupRef.current = popup;
    popup.setText(location.label);

    return () => {
      marker.remove();
      markerRef.current = null;
      popupRef.current = null;
    };
  }, [location.lat, location.lng, location.label, map, mapLoaded]);

  useEffect(() => {
    if (!markerRef.current) {
      return;
    }
    const coords = safeLatLngToLngLat(location.lat, location.lng);
    if (!coords) {
      return;
    }
    markerRef.current.setLngLat(coords);
    popupRef.current?.setText(location.label);
  }, [location.lat, location.lng, location.label]);

  return null;
});

export {
  UserLocationMarker,
};
