import { NAGAEVO_CENTER, NAGAEVO_MAP_BOUNDS } from './geo-data';
const EARTH_RADIUS_KM = 6371;
const DEGREES_IN_SEMICIRCLE = 180;
const GEO = {
    settlement: 'Нагаево',
    region: 'Республика Башкортостан',
    district: 'Октябрьский район, г. Уфа',
    postalCode: '450900',
    radiusKm: 50,
    center: NAGAEVO_CENTER,
    mapBounds: NAGAEVO_MAP_BOUNDS,
    defaultZoom: 13,
    minZoom: 12,
    maxZoom: 17,
} as const;

export {
  EARTH_RADIUS_KM,
  DEGREES_IN_SEMICIRCLE,
  GEO,
}
