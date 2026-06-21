import { useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Listing } from '@/types/listing';
import type { AccountLocation } from '@/types/location';
import { GEO } from '@/constants';
import { ClusterMarkers } from './ClusterMarkers';
import { FitListingsBounds } from './FitListingsBounds';
import { FlyToUserLocation } from './FlyToUserLocation';
import { LocateButton } from './LocateButton';
import { MapFilters } from './MapFilters';
import { MapViewport } from './MapViewport';
import { SettlementMarker } from './SettlementMarker';
import { UserLocationMarker } from './UserLocationMarker';
import './mapIcons';
import styles from './ProvidersMap.module.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const MAP_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

interface ProvidersMapProps {
  listings: Listing[];
  showFilters?: boolean;
  fitToListings?: boolean;
  userLocation?: AccountLocation | null;
  mapCenter?: {
    lat: number;
    lng: number;
  };
}

function ProvidersMap({
  listings,
  showFilters = true,
  fitToListings = false,
  userLocation = null,
  mapCenter,
}: ProvidersMapProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!categoryFilter) {
      return listings;
    }
    return listings.filter((listing) => listing.category === categoryFilter);
  }, [listings, categoryFilter]);

  const handleFilterChange = (category: string | null) => {
    setCategoryFilter(category);
  };

  return (
    <div className={styles.mapWrapper}>
      {showFilters && (
        <MapFilters categoryFilter={categoryFilter} onFilterChange={handleFilterChange} />
      )}
      <MapContainer
        center={[
          mapCenter?.lat ?? userLocation?.lat ?? GEO.center.lat,
          mapCenter?.lng ?? userLocation?.lng ?? GEO.center.lng,
        ]}
        zoom={GEO.defaultZoom}
        minZoom={GEO.minZoom}
        maxZoom={GEO.maxZoom}
        className={styles.map}
        scrollWheelZoom
        maxBounds={GEO.mapBounds}
        maxBoundsViscosity={0.85}
      >
        <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILES} />
        {fitToListings || categoryFilter ? (
          <FitListingsBounds
            key={categoryFilter ?? 'all'}
            listings={filtered}
            userLocation={userLocation}
          />
        ) : (
          <MapViewport />
        )}
        <LocateButton />
        <FlyToUserLocation location={userLocation} />
        <SettlementMarker />
        {userLocation && <UserLocationMarker location={userLocation} />}
        <ClusterMarkers listings={filtered} />
      </MapContainer>
    </div>
  );
}

export {
  ProvidersMap,
};
