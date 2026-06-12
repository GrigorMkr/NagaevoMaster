import { useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Listing } from '@/types/listing';
import type { AccountLocation } from '@/types/location';
import { GEO } from '@/constants';
import { ClusterMarkers } from './ClusterMarkers';
import { FitListingsBounds } from './FitListingsBounds';
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
function ProvidersMap({ listings, showFilters = true, fitToListings = false, userLocation = null, mapCenter, }: ProvidersMapProps) {
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const filtered = useMemo(() => {
        if (!categoryFilter)
            return listings;
        return listings.filter((l) => l.category === categoryFilter);
    }, [listings, categoryFilter]);
    return (<div className={styles.mapWrapper}>
      {showFilters && (<MapFilters categoryFilter={categoryFilter} onFilterChange={setCategoryFilter}/>)}
      <MapContainer center={[mapCenter?.lat ?? userLocation?.lat ?? GEO.center.lat, mapCenter?.lng ?? userLocation?.lng ?? GEO.center.lng]} zoom={GEO.defaultZoom} minZoom={GEO.minZoom} maxZoom={GEO.maxZoom} className={styles.map} scrollWheelZoom={false} maxBounds={GEO.mapBounds} maxBoundsViscosity={0.85}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {fitToListings ? (<FitListingsBounds listings={filtered}/>) : (<MapViewport />)}
        <LocateButton />
        <SettlementMarker />
        {userLocation && <UserLocationMarker location={userLocation}/>}
        <ClusterMarkers listings={filtered}/>
      </MapContainer>
    </div>);
}

export {
  ProvidersMap,
}
