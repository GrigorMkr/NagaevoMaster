import L from 'leaflet';

const MARKER_SIZE = 46;

const defaultMarkerIcon = L.icon({
  iconUrl: `${import.meta.env.BASE_URL}leaflet/marker-icon.png`,
  iconRetinaUrl: `${import.meta.env.BASE_URL}leaflet/marker-icon-2x.png`,
  shadowUrl: `${import.meta.env.BASE_URL}leaflet/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const centerMarkerIcon = L.divIcon({
  className: 'mapCenterMarker',
  html: '<span aria-hidden="true"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const listingMarkerCache = new Map<string, L.DivIcon>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createListingMarkerIcon(imageUrl: string): L.DivIcon {
  const cached = listingMarkerCache.get(imageUrl);
  if (cached) {
    return cached;
  }

  const safeUrl = escapeHtml(imageUrl);
  const icon = L.divIcon({
    className: 'mapListingMarker',
    html: `<div class="mapListingMarkerInner"><img src="${safeUrl}" alt="" loading="lazy" decoding="async" /></div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -MARKER_SIZE / 2 - 4],
  });

  listingMarkerCache.set(imageUrl, icon);
  return icon;
}

L.Marker.prototype.options.icon = defaultMarkerIcon;

export {
  centerMarkerIcon,
  createListingMarkerIcon,
  defaultMarkerIcon,
}
