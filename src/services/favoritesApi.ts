import { asArray } from '@/utils/apiGuards';
import { api } from './api';
async function fetchFavorites(): Promise<string[]> {
    try {
        const response = await api.get<string[]>('/favorites');
        return asArray<string>(response.data);
    }
    catch {
        return [];
    }
}
async function addFavorite(listingId: string): Promise<void> {
    await api.post(`/favorites/${listingId}`);
}
async function removeFavorite(listingId: string): Promise<void> {
    await api.delete(`/favorites/${listingId}`);
}

async function fetchFavoriteListings(): Promise<import('@/types/listing').Listing[]> {
    try {
        const response = await api.get<import('@/types/listing').Listing[]>('/favorites/listings');
        const { enrichListings } = await import('@/utils/listingEnrich');
        return enrichListings(asArray(response.data));
    }
    catch {
        return [];
    }
}

export {
  fetchFavorites,
  fetchFavoriteListings,
  addFavorite,
  removeFavorite,
}
