import { env } from '../config/env.js';

const VK_MAPS_API_BASE = 'https://maps.vk.com/api';

interface VkMapsAddressDetails {
  country?: string;
  region?: string;
  locality?: string;
  street?: string;
  building?: string;
  suburb?: string;
}

interface VkMapsSearchResult {
  address?: string;
  address_details?: VkMapsAddressDetails;
  pin?: [number, number];
}

interface VkMapsSearchResponse {
  results: VkMapsSearchResult[];
}

interface GeoSearchResult {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

function formatVkAddressLabel(result: VkMapsSearchResult): string {
  const details = result.address_details;
  if (details) {
    const parts: string[] = [];
    const settlement = details.locality ?? details.region;
    if (settlement) parts.push(settlement);
    if (details.street) {
      parts.push(details.building ? `${details.street}, д. ${details.building}` : details.street);
    }
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }
  if (result.address) {
    return result.address.split(',').slice(0, 4).join(',').trim();
  }
  return '';
}

function mapVkResult(result: VkMapsSearchResult): GeoSearchResult | null {
  const pin = result.pin;
  if (!pin || pin.length < 2) {
    return null;
  }
  const [lng, lat] = pin;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const label = formatVkAddressLabel(result) || result.address?.split(',').slice(0, 3).join(',').trim() || '';
  if (!label) {
    return null;
  }
  return {
    label,
    address: result.address ?? label,
    lat,
    lng,
  };
}

async function vkMapsFetch(path: string, params: URLSearchParams): Promise<VkMapsSearchResponse> {
  const apiKey = env.VK_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('VK Maps API key is not configured');
  }

  params.set('api_key', apiKey);
  params.set('lang', 'ru');
  params.set('isocode', 'RU');
  params.set('fields', 'address_details,address,pin');

  const response = await fetch(`${VK_MAPS_API_BASE}${path}?${params}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`VK Maps HTTP ${response.status}`);
  }

  return await response.json() as VkMapsSearchResponse;
}

async function vkMapsSearch(query: string, location?: { lat: number; lng: number }): Promise<GeoSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '12',
  });
  if (location) {
    params.set('location', `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`);
  }
  const data = await vkMapsFetch('/search', params);
  return data.results
    .map(mapVkResult)
    .filter((item): item is GeoSearchResult => item !== null);
}

async function vkMapsReverse(lat: number, lng: number): Promise<GeoSearchResult | null> {
  const params = new URLSearchParams({
    q: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    limit: '1',
    radius: '80',
  });
  const data = await vkMapsFetch('/search', params);
  const mapped = data.results.map(mapVkResult).find((item) => item !== null);
  return mapped ?? null;
}

function isVkMapsEnabled(): boolean {
  return Boolean(env.VK_MAPS_API_KEY?.trim());
}

export {
  isVkMapsEnabled,
  vkMapsSearch,
  vkMapsReverse,
};

export type {
  GeoSearchResult,
};
