import { api } from './api';

interface AddressSearchResult {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

async function searchAddresses(
  query: string,
  settlement?: string,
  near?: { lat: number; lng: number },
): Promise<AddressSearchResult[]> {
  const response = await api.get<AddressSearchResult[]>('/geo/search', {
    params: {
      q: query,
      ...(settlement ? { settlement } : {}),
      ...(near ? { nearLat: near.lat, nearLng: near.lng } : {}),
    },
  });
  return response.data;
}

async function reverseGeocode(lat: number, lng: number): Promise<AddressSearchResult> {
  const response = await api.get<AddressSearchResult>('/geo/reverse', {
    params: { lat, lng },
  });
  return response.data;
}

export {
  searchAddresses,
  reverseGeocode,
};

export type {
  AddressSearchResult,
};
