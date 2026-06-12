import { api } from './api'

export async function fetchFavorites(): Promise<string[]> {
  const response = await api.get<string[]>('/favorites')
  return response.data
}

export async function addFavorite(listingId: string): Promise<void> {
  await api.post(`/favorites/${listingId}`)
}

export async function removeFavorite(listingId: string): Promise<void> {
  await api.delete(`/favorites/${listingId}`)
}
