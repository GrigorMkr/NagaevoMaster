import { memo, useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { GEO, MAP_BOUNDS_PADDING_PX } from '@/constants'
import type { Listing } from '@/types/listing'

interface FitListingsBoundsProps {
  listings: Listing[]
  enabled?: boolean
}

export const FitListingsBounds = memo(function FitListingsBounds({
  listings,
  enabled = true,
}: FitListingsBoundsProps) {
  const map = useMap()

  useEffect(() => {
    if (!enabled) return

    if (listings.length === 0) {
      map.fitBounds(GEO.mapBounds, {
        padding: [MAP_BOUNDS_PADDING_PX, MAP_BOUNDS_PADDING_PX],
        maxZoom: GEO.defaultZoom,
      })
      return
    }

    const bounds = L.latLngBounds(
      listings.map((listing) => [listing.location.lat, listing.location.lng]),
    )

    map.fitBounds(bounds, {
      padding: [MAP_BOUNDS_PADDING_PX, MAP_BOUNDS_PADDING_PX],
      maxZoom: GEO.defaultZoom,
    })
  }, [enabled, listings, map])

  return null
})
