import { memo, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Listing } from '@/types/listing';
import { serviceDetailPath } from '@/constants';
import { getMapMarkerImage } from '@/data/mock/listingImages';
import { escapeHtml } from '@/utils/escapeHtml';
import { createListingMarkerIcon } from './mapIcons';

const MARKER_ZOOM = 15;

interface ClusterMarkersProps {
  listings: Listing[];
}

const ClusterMarkers = memo(function ClusterMarkers({ listings }: ClusterMarkersProps) {
  const map = useMap();

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 52,
    });

    listings.forEach((listing) => {
      const imageUrl = listing.images[0] || getMapMarkerImage(listing.category, listing.subcategory, listing.id);
      const marker = L.marker([listing.location.lat, listing.location.lng], {
        icon: createListingMarkerIcon(imageUrl),
      });

      const path = serviceDetailPath(listing.id);
      const popupHtml = `
        <div style="font-family:sans-serif;font-size:14px;line-height:1.5">
          <strong style="display:block;margin-bottom:4px">${escapeHtml(listing.title)}</strong>
          <span style="color:#17624a;font-weight:600">от ${escapeHtml(String(listing.priceFrom))} ₽ / ${escapeHtml(listing.unit)}</span><br/>
          ${escapeHtml(listing.location.address)}<br/>
          <a href="${escapeHtml(path)}" style="display:inline-block;margin-top:8px;color:#17624a;font-weight:600">Подробнее →</a>
        </div>
      `;
      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on('click', () => {
        map.flyTo([listing.location.lat, listing.location.lng], MARKER_ZOOM, {
          duration: 0.75,
          easeLinearity: 0.25,
        });
        window.setTimeout(() => marker.openPopup(), 400);
      });

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [map, listings]);

  return null;
});

export {
  ClusterMarkers,
};
