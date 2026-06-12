import { memo, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { GEO } from '@/constants'

export const MapViewport = memo(function MapViewport() {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(GEO.mapBounds, { padding: [32, 32], maxZoom: GEO.defaultZoom })
    map.setMaxBounds(GEO.mapBounds)
  }, [map])

  return null
})
