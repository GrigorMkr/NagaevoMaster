import type { Listing } from '@/types/listing'
import { api } from './api'

export interface CreateListingPayload {
  category: string
  subcategory: string
  title: string
  description: string
  priceFrom: number
  priceTo?: number
  unit: Listing['unit']
  phone: string
  location: Listing['location']
  imageIds?: string[]
}

export async function createListing(payload: CreateListingPayload): Promise<Listing> {
  const response = await api.post<Listing>('/listings', payload)
  return response.data
}

export async function reportListing(listingId: string, reason?: string): Promise<void> {
  await api.post(`/listings/${listingId}/report`, { reason })
}
