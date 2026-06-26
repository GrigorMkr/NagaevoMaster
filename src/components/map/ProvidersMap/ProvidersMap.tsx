import { useMemo, useState } from 'react';
import type { Listing } from '@/types/listing';
import type { AccountLocation } from '@/types/location';
import { GEO } from '@/constants';
import { VkMap } from '@/components/map/VkMap/VkMap';
import { isValidLatLng } from '@/utils/mapBounds';
import { ClusterMarkers } from './ClusterMarkers';
import { FitListingsBounds } from './FitListingsBounds';
import { FlyToUserLocation } from './FlyToUserLocation';
import { LocateButton } from './LocateButton';
import { MapFilters } from './MapFilters';
import { MapViewport } from './MapViewport';
import { SettlementMarker } from './SettlementMarker';
import { UserLocationMarker } from './UserLocationMarker';
import styles from './ProvidersMap.module.css';

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

  const center: [number, number] = useMemo(() => {
    if (mapCenter && isValidLatLng(mapCenter.lat, mapCenter.lng)) {
      return [mapCenter.lat, mapCenter.lng];
    }
    if (userLocation && isValidLatLng(userLocation.lat, userLocation.lng)) {
      return [userLocation.lat, userLocation.lng];
    }
    return [GEO.center.lat, GEO.center.lng];
  }, [mapCenter?.lat, mapCenter?.lng, userLocation?.lat, userLocation?.lng]);

  const hasUserLocation = Boolean(
    userLocation && isValidLatLng(userLocation.lat, userLocation.lng),
  );

  return (
    <div className={styles.mapWrapper}>
      {showFilters && (
        <MapFilters categoryFilter={categoryFilter} onFilterChange={handleFilterChange} />
      )}
      <VkMap
        center={center}
        zoom={GEO.defaultZoom}
        minZoom={GEO.minZoom}
        maxZoom={GEO.maxZoom}
        className={styles.map}
        scrollZoom
        maxBounds={GEO.mapBounds}
        zoomControl={false}
      >
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
        <FlyToUserLocation location={hasUserLocation ? userLocation : null} />
        <SettlementMarker />
        {hasUserLocation && userLocation && <UserLocationMarker location={userLocation} />}
        <ClusterMarkers listings={filtered} />
      </VkMap>
    </div>
  );
}

export {
  ProvidersMap,
};
