import type { Review } from '@/types/listing'
import { api } from './api'

export interface ReviewListItem extends Review {}

export async function fetchListingReviews(listingId: string): Promise<ReviewListItem[]> {
  const response = await api.get<ReviewListItem[]>(`/listings/${listingId}/reviews`)
  return response.data
}

export async function createListingReview(
  listingId: string,
  data: { rating: number; text: string },
): Promise<ReviewListItem> {
  const response = await api.post<ReviewListItem>(`/listings/${listingId}/reviews`, data)
  return response.data
}
