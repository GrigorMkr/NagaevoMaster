import { memo, useEffect } from 'react';
import mmrgl from 'mmr-gl';
import type { Listing } from '@/types/listing';
import { serviceDetailPath } from '@/constants';
import { getMapMarkerImage } from '@/data/mock/listingImages';
import { escapeHtml } from '@/utils/escapeHtml';
import { safeLatLngToLngLat } from '@/utils/mapBounds';
import { useVkMap } from '@/components/map/VkMap/VkMapContext';
import { createListingMarkerElement } from './mapMarkers';

const MARKER_ZOOM = 15;

interface ClusterMarkersProps {
  listings: Listing[];
}

const ClusterMarkers = memo(function ClusterMarkers({ listings }: ClusterMarkersProps) {
  const { map, mapLoaded } = useVkMap();

  useEffect(() => {
    if (!map || !mapLoaded) {
      return;
    }

    const markers: mmrgl.Marker[] = [];

    listings.forEach((listing) => {
      const coords = safeLatLngToLngLat(listing.location?.lat, listing.location?.lng);
      if (!coords) {
        return;
      }

      const imageUrl = listing.images[0] || getMapMarkerImage(listing.category, listing.subcategory, listing.id);
      const element = createListingMarkerElement(imageUrl);
      const path = serviceDetailPath(listing.id);
      const address = listing.location?.address ?? '';
      const popupHtml = `
        <div style="font-family:sans-serif;font-size:14px;line-height:1.5">
          <strong style="display:block;margin-bottom:4px">${escapeHtml(listing.title)}</strong>
          <span style="color:#17624a;font-weight:600">от ${escapeHtml(String(listing.priceFrom))} ₽ / ${escapeHtml(listing.unit)}</span><br/>
          ${escapeHtml(address)}<br/>
          <a href="${escapeHtml(path)}" style="display:inline-block;margin-top:8px;color:#17624a;font-weight:600">Подробнее →</a>
        </div>
      `;

      const popup = new mmrgl.Popup({ maxWidth: '280px', closeButton: true, offset: 24 }).setHTML(popupHtml);
      const marker = new mmrgl.Marker({ element, anchor: 'center' })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        map.flyTo({
          center: coords,
          zoom: MARKER_ZOOM,
          duration: 750,
        });
        window.setTimeout(() => marker.togglePopup(), 400);
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [map, mapLoaded, listings]);

  return null;
});

export {
  ClusterMarkers,
};
