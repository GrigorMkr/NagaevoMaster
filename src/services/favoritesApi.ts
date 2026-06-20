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

export {
  fetchFavorites,
  addFavorite,
  removeFavorite,
}
