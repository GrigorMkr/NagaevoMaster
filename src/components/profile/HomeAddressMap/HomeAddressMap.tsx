import { useEffect, useRef } from 'react';
import mmrgl from 'mmr-gl';
import type { HomeLocation } from '@/types/location';
import { NAGAEVO_CENTER, SERVICE_REGION_MAP_BOUNDS } from '@/constants/geo-data';
import {
  ADDRESS_MAP_DEFAULT_ZOOM,
  ADDRESS_MAP_MAX_ZOOM,
  ADDRESS_MAP_MIN_ZOOM,
  ADDRESS_MAP_PIN_ZOOM,
} from '@/constants/mapTiles';
import { VkMap } from '@/components/map/VkMap/VkMap';
import { useVkMap } from '@/components/map/VkMap/VkMapContext';
import { latLngToLngLat } from '@/utils/mapBounds';
import styles from './HomeAddressMap.module.css';

interface HomeAddressMapProps {
  location: HomeLocation | null;
  mapCenter?: [number, number];
  onPick: (lat: number, lng: number) => void;
  onReverseGeocode?: (lat: number, lng: number) => void;
}

function MapViewportSync({
  location,
  mapCenter,
}: {
  location: HomeLocation | null;
  mapCenter?: [number, number];
}) {
  const { map } = useVkMap();
  const lastKey = useRef('');

  useEffect(() => {
    if (!map) {
      return;
    }

    const nextKey = location
      ? `${location.lat.toFixed(5)}:${location.lng.toFixed(5)}`
      : mapCenter
        ? `${mapCenter[0].toFixed(5)}:${mapCenter[1].toFixed(5)}:center`
        : '';
    if (!nextKey || nextKey === lastKey.current) {
      return;
    }
    lastKey.current = nextKey;

    const target = location
      ? latLngToLngLat(location.lat, location.lng)
      : mapCenter
        ? latLngToLngLat(mapCenter[0], mapCenter[1])
        : null;
    if (!target) {
      return;
    }

    map.flyTo({
      center: target,
      zoom: location ? ADDRESS_MAP_PIN_ZOOM : ADDRESS_MAP_DEFAULT_ZOOM,
      duration: 750,
    });
  }, [location, map, mapCenter]);

  return null;
}

function DraggablePin({
  location,
  onPick,
  onReverseGeocode,
}: {
  location: HomeLocation;
  onPick: (lat: number, lng: number) => void;
  onReverseGeocode?: (lat: number, lng: number) => void;
}) {
  const { map } = useVkMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const marker = new mmrgl.Marker({ draggable: true, color: '#17624a' })
      .setLngLat(latLngToLngLat(location.lat, location.lng))
      .addTo(map);

    const handleDragEnd = () => {
      const { lat, lng } = marker.getLngLat();
      onPick(lat, lng);
      onReverseGeocode?.(lat, lng);
    };

    marker.on('dragend', handleDragEnd);

    return () => {
      marker.off('dragend', handleDragEnd);
      marker.remove();
    };
  }, [location.lat, location.lng, map, onPick, onReverseGeocode]);

  return null;
}

function HomeAddressMap({ location, mapCenter, onPick, onReverseGeocode }: HomeAddressMapProps) {
  const center: [number, number] = location
    ? [location.lat, location.lng]
    : (mapCenter ?? [NAGAEVO_CENTER.lat, NAGAEVO_CENTER.lng]);

  const handleMapClick = (lat: number, lng: number) => {
    onPick(lat, lng);
    onReverseGeocode?.(lat, lng);
  };

  return (
    <div className={styles.wrap}>
      {location?.address && (
        <p className={styles.addressChip}>{location.address}</p>
      )}
      <div className={styles.mapShell}>
        <VkMap
          className={styles.map}
          center={center}
          zoom={location ? ADDRESS_MAP_PIN_ZOOM : ADDRESS_MAP_DEFAULT_ZOOM}
          minZoom={ADDRESS_MAP_MIN_ZOOM}
          maxZoom={ADDRESS_MAP_MAX_ZOOM}
          maxBounds={SERVICE_REGION_MAP_BOUNDS}
          scrollZoom
          zoomControl
          zoomControlPosition="top-right"
          onClick={handleMapClick}
        >
          <MapViewportSync location={location} mapCenter={mapCenter} />
          {location && (
            <DraggablePin
              location={location}
              onPick={onPick}
              onReverseGeocode={onReverseGeocode}
            />
          )}
        </VkMap>
      </div>
      <p className={styles.hint}>
        Нажмите на карту или перетащите метку. Увеличьте масштаб — видны улицы и дома.
      </p>
    </div>
  );
}

export {
  HomeAddressMap,
};
