/** ~50 км от с. Нагаево: Уфа, Чишмы, Иглино и окрестные сёла */
const REGION_VIEWBOX = {
  minLon: 55.34,
  maxLat: 55.08,
  maxLon: 56.9,
  minLat: 54.17,
} as const;

interface NominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  state?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

function formatAddressLabel(result: NominatimResult): string {
  const parts: string[] = [];
  const settlement = result.address?.city
    ?? result.address?.town
    ?? result.address?.village
    ?? result.address?.suburb;
  if (settlement) parts.push(settlement);
  if (result.address?.road) {
    const road = result.address.road;
    parts.push(result.address.house_number ? `${road}, д. ${result.address.house_number}` : road);
  }
  if (parts.length > 0) {
    return parts.join(', ');
  }
  return result.display_name.split(',').slice(0, 4).join(',').trim();
}

async function nominatimFetchArray(path: string, params: URLSearchParams): Promise<NominatimResult[]> {
  const response = await fetch(`https://nominatim.openstreetmap.org${path}?${params}`, {
    headers: {
      'User-Agent': 'NagaevoMaster/1.0 (https://nagaevomaster.ru; info@nagaevomaster.ru)',
      'Accept-Language': 'ru',
    },
  });

  if (!response.ok) {
    throw new Error('Nominatim unavailable');
  }

  return await response.json() as NominatimResult[];
}

async function nominatimFetchOne(path: string, params: URLSearchParams): Promise<NominatimResult | null> {
  const response = await fetch(`https://nominatim.openstreetmap.org${path}?${params}`, {
    headers: {
      'User-Agent': 'NagaevoMaster/1.0 (https://nagaevomaster.ru; info@nagaevomaster.ru)',
      'Accept-Language': 'ru',
    },
  });

  if (!response.ok) {
    throw new Error('Nominatim unavailable');
  }

  return await response.json() as NominatimResult;
}

export {
  REGION_VIEWBOX,
  formatAddressLabel,
  nominatimFetchArray,
  nominatimFetchOne,
};

export type {
  NominatimResult,
};
