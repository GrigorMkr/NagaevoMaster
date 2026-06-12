import { useMemo, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import type { Listing } from '@/types/listing'
import { GEO } from '@/constants'
import { ClusterMarkers } from './ClusterMarkers'
import { LocateButton } from './LocateButton'
import { MapFilters } from './MapFilters'
import { MapViewport } from './MapViewport'
import { SettlementMarker } from './SettlementMarker'
import './mapIcons'
import styles from './ProvidersMap.module.css'

import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

interface ProvidersMapProps {
  listings: Listing[]
  showFilters?: boolean
}

export function ProvidersMap({ listings, showFilters = true }: ProvidersMapProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!categoryFilter) return listings
    return listings.filter((l) => l.category === categoryFilter)
  }, [listings, categoryFilter])

  return (
    <div className={styles.wrap}>
      {showFilters && (
        <MapFilters categoryFilter={categoryFilter} onFilterChange={setCategoryFilter} />
      )}
      <MapContainer
        center={[GEO.center.lat, GEO.center.lng]}
        zoom={GEO.defaultZoom}
        minZoom={GEO.minZoom}
        maxZoom={GEO.maxZoom}
        className={styles.map}
        scrollWheelZoom={false}
        maxBounds={GEO.mapBounds}
        maxBoundsViscosity={0.85}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport />
        <LocateButton />
        <SettlementMarker />
        <ClusterMarkers listings={filtered} />
      </MapContainer>
    </div>
  )
}
