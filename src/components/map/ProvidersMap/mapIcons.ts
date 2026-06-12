import L from 'leaflet';
const defaultMarkerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
L.Marker.prototype.options.icon = defaultMarkerIcon;

export {
  defaultMarkerIcon,
  centerMarkerIcon,
}
