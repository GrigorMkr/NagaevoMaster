import { memo, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Listing } from '@/types/listing'
import { serviceDetailPath } from '@/constants'
import { defaultMarkerIcon } from './mapIcons'

interface ClusterMarkersProps {
  listings: Listing[]
}

export const ClusterMarkers = memo(function ClusterMarkers({ listings }: ClusterMarkersProps) {
  const map = useMap()

  useEffect(() => {
    const cluster = L.markerClusterGroup({ chunkedLoading: true })

    listings.forEach((listing) => {
      const marker = L.marker([listing.location.lat, listing.location.lng], {
        icon: defaultMarkerIcon,
      })
      const path = serviceDetailPath(listing.id)
      const popupHtml = `
        <div style="font-family:sans-serif;font-size:14px;line-height:1.5">
          <strong>${listing.title}</strong><br/>
          <span style="color:#17624a;font-weight:600">от ${listing.priceFrom} ₽ / ${listing.unit}</span><br/>
          ${listing.location.address}<br/>
          <a href="${path}" style="display:inline-block;margin-top:8px;color:#17624a;font-weight:600;font-size:14px">Подробнее →</a>
        </div>
      `
      marker.bindPopup(popupHtml)
      cluster.addLayer(marker)
    })

    map.addLayer(cluster)
    return () => {
      map.removeLayer(cluster)
    }
  }, [map, listings])

  return null
})
