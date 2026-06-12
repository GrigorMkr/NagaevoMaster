import { memo, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { GEO, MAP_BOUNDS_PADDING_PX } from '@/constants';
const MapViewport = memo(function MapViewport() {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(GEO.mapBounds, {
            padding: [MAP_BOUNDS_PADDING_PX, MAP_BOUNDS_PADDING_PX],
            maxZoom: GEO.defaultZoom,
        });
        map.setMaxBounds(GEO.mapBounds);
    }, [map]);
    return null;
});

export {
  MapViewport,
}
