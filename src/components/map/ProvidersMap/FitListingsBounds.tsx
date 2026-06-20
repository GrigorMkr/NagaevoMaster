import { memo, useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { GEO, MAP_BOUNDS_PADDING_PX } from '@/constants';
import type { Listing } from '@/types/listing';
import type { AccountLocation } from '@/types/location';
interface FitListingsBoundsProps {
    listings: Listing[];
    userLocation?: AccountLocation | null;
    enabled?: boolean;
}
const FitListingsBounds = memo(function FitListingsBounds({ listings, userLocation = null, enabled = true, }: FitListingsBoundsProps) {
    const map = useMap();
    useEffect(() => {
        if (!enabled)
            return;
        const points: [number, number][] = listings.map((listing) => [listing.location.lat, listing.location.lng]);
        if (userLocation) {
            points.push([userLocation.lat, userLocation.lng]);
        }
        if (points.length === 0) {
            map.fitBounds(GEO.mapBounds, {
                padding: [MAP_BOUNDS_PADDING_PX, MAP_BOUNDS_PADDING_PX],
                maxZoom: GEO.defaultZoom,
            });
            return;
        }
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
            padding: [MAP_BOUNDS_PADDING_PX, MAP_BOUNDS_PADDING_PX],
            maxZoom: GEO.defaultZoom,
        });
    }, [enabled, listings, userLocation, map]);
    return null;
});

export {
  FitListingsBounds,
}
