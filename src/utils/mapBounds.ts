type LatLngBounds = [[number, number], [number, number]];
type LngLatBoundsLike = [[number, number], [number, number]];

function isValidLatLng(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number'
    && typeof lng === 'number'
    && Number.isFinite(lat)
    && Number.isFinite(lng);
}

/** Leaflet [[south, west], [north, east]] → MapLibre [[west, south], [east, north]] */
function latLngBoundsToLngLatBounds(bounds: LatLngBounds): LngLatBoundsLike {
  const [[south, west], [north, east]] = bounds;
  return [[west, south], [east, north]];
}

function lngLatToLatLng(lng: number, lat: number): [number, number] {
  return [lat, lng];
}

function latLngToLngLat(lat: number, lng: number): [number, number] {
  return [lng, lat];
}

function safeLatLngToLngLat(lat: unknown, lng: unknown): [number, number] | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return latLngToLngLat(lat, lng);
}

export type {
  LatLngBounds,
  LngLatBoundsLike,
};

export {
  isValidLatLng,
  latLngBoundsToLngLatBounds,
  lngLatToLatLng,
  latLngToLngLat,
  safeLatLngToLngLat,
};
