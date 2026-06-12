import { NAGAEVO_CENTER, NAGAEVO_MAP_BOUNDS } from './geo-data'

export const GEO = {
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
} as const
