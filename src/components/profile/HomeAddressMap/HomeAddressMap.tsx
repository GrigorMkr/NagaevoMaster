import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import type { HomeLocation } from '@/types/location';
import { NAGAEVO_CENTER, NAGAEVO_MAP_BOUNDS } from '@/constants/geo-data';
import 'leaflet/dist/leaflet.css';
import styles from './HomeAddressMap.module.css';

const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

interface HomeAddressMapProps {
  location: HomeLocation | null;
  onPick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function HomeAddressMap({ location, onPick }: HomeAddressMapProps) {
  const center: [number, number] = location
    ? [location.lat, location.lng]
    : [NAGAEVO_CENTER.lat, NAGAEVO_CENTER.lng];

  return (
    <div className={styles.wrap}>
      <MapContainer
        className={styles.map}
        center={center}
        zoom={location ? 15 : 13}
        maxBounds={NAGAEVO_MAP_BOUNDS}
        scrollWheelZoom
      >
        <TileLayer url={MAP_TILES} attribution={MAP_ATTRIBUTION} />
        <MapClickHandler onPick={onPick} />
        {location && (
          <CircleMarker
            center={[location.lat, location.lng]}
            radius={10}
            pathOptions={{ color: '#17624a', fillColor: '#2d9a74', fillOpacity: 0.9, weight: 2 }}
          />
        )}
      </MapContainer>
      <p className={styles.hint}>Нажмите на карту, чтобы указать дом</p>
    </div>
  );
}

export {
  HomeAddressMap,
};
