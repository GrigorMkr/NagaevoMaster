import type { ListingLocation } from '@/types/listing';

const NAGAEVO_CENTER = {
    lat: 54.6247,
    lng: 56.1194,
} as const;

/** Карта посёлка (крупный масштаб) */
const NAGAEVO_MAP_BOUNDS: [
    [number, number],
    [number, number],
] = [
    [54.598, 56.068],
    [54.655, 56.155],
];

/** ~50 км от Нагаево: Уфа, Чишмы, Иглино и сёла */
const SERVICE_REGION_MAP_BOUNDS: [
    [number, number],
    [number, number],
] = [
    [54.17, 55.34],
    [55.08, 56.9],
];

const REGION_SETTLEMENTS = [
    { id: 'nagaevo', label: 'с. Нагаево', searchLabel: 'село Нагаево', lat: 54.6247, lng: 56.1194 },
    { id: 'ufa', label: 'г. Уфа', searchLabel: 'Уфа', lat: 54.7352, lng: 55.9578 },
    { id: 'chishmy', label: 'с. Чишмы', searchLabel: 'Чишмы', lat: 54.5903, lng: 55.3764 },
    { id: 'iglino', label: 'с. Иглино', searchLabel: 'Иглино', lat: 54.8381, lng: 56.4167 },
    { id: 'mikhaylovka', label: 'п. Михайловка', searchLabel: 'Михайловка', lat: 54.2339, lng: 55.9056 },
    { id: 'oktyabrsky', label: 'г. Октябрьский', searchLabel: 'Октябрьский', lat: 54.4817, lng: 53.4717 },
    { id: 'priyutovo', label: 'п. Приютово', searchLabel: 'Приютово', lat: 53.8942, lng: 53.9281 },
    { id: 'mesyagutovo', label: 'с. Месягутово', searchLabel: 'Месягутово', lat: 54.0383, lng: 55.3167 },
    { id: 'makarovo', label: 'с. Макарово', searchLabel: 'Макарово', lat: 54.6833, lng: 56.0833 },
    { id: 'nurlino', label: 'с. Нурлино', searchLabel: 'Нурлино', lat: 54.6500, lng: 56.0500 },
    { id: 'nikolo-berezovka', label: 'д. Николо-Берёзовка', searchLabel: 'Николо-Берёзовка', lat: 54.6100, lng: 56.0800 },
    { id: 'timashevo', label: 'с. Тимашево', searchLabel: 'Тимашево', lat: 54.5667, lng: 56.1167 },
    { id: 'kirgiz-miyaki', label: 'с. Киргиз-Мияки', searchLabel: 'Киргиз-Мияки', lat: 53.6167, lng: 54.7833 },
    { id: 'blagoveshchensk', label: 'г. Благовещенск', searchLabel: 'Благовещенск Башкортостан', lat: 55.0333, lng: 55.9833 },
] as const;

const NAGAEVO_STREETS = {
    center: { lat: 54.6247, lng: 56.1194, label: 'с. Нагаево' },
    nagaevskoeShosse: { lat: 54.6383, lng: 56.0914, label: 'Нагаевское шоссе' },
    sovetskaya: { lat: 54.6258, lng: 56.1142, label: 'ул. Советская' },
    roshchinskaya: { lat: 54.6221, lng: 56.1058, label: 'ул. Рощинская' },
    zaprudnaya: { lat: 54.6284, lng: 56.1086, label: 'ул. Запрудная' },
    mekhanizatorov: { lat: 54.6312, lng: 56.1218, label: 'ул. Механизаторов' },
    sadovaya: { lat: 54.6195, lng: 56.1165, label: 'ул. Садовая' },
    lesnaya: { lat: 54.6178, lng: 56.1245, label: 'ул. Лесная' },
    polevaya: { lat: 54.6125, lng: 56.1120, label: 'ул. Полевая' },
    molodezhnaya: { lat: 54.6265, lng: 56.1285, label: 'ул. Молодёжная' },
    tsentralnaya: { lat: 54.6240, lng: 56.1175, label: 'ул. Центральная' },
    dk: { lat: 54.6255, lng: 56.1128, label: 'Нагаевский ДК' },
    mosque: { lat: 54.6238, lng: 56.1155, label: 'мечеть' },
} as const;
function nagaevoAddress(streetKey: keyof typeof NAGAEVO_STREETS, house?: string, extra?: string): ListingLocation {
    const street = NAGAEVO_STREETS[streetKey];
    const housePart = house ? `, д. ${house}` : '';
    const extraPart = extra ? `, ${extra}` : '';
    return {
        lat: street.lat,
        lng: street.lng,
        address: `с. Нагаево, ${street.label}${housePart}${extraPart}`,
    };
}
function offsetLocation(location: ListingLocation, latDelta: number, lngDelta: number): ListingLocation {
    return {
        ...location,
        lat: location.lat + latDelta,
        lng: location.lng + lngDelta,
    };
}

export {
  NAGAEVO_CENTER,
  NAGAEVO_MAP_BOUNDS,
  SERVICE_REGION_MAP_BOUNDS,
  REGION_SETTLEMENTS,
  NAGAEVO_STREETS,
  nagaevoAddress,
  offsetLocation,
}
