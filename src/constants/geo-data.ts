import type { ListingLocation } from '@/types/listing';
const NAGAEVO_CENTER = {
    lat: 54.6247,
    lng: 56.1194,
} as const;
const NAGAEVO_MAP_BOUNDS: [
    [
        number,
        number
    ],
    [
        number,
        number
    ]
] = [
    [54.598, 56.068],
    [54.655, 56.155],
];
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
  NAGAEVO_STREETS,
  nagaevoAddress,
  offsetLocation,
}
