import type { Listing } from '@/types/listing';
import { api } from './api';
interface CreateListingPayload {
    category: string;
    subcategory: string;
    title: string;
    description: string;
    priceFrom: number;
    priceTo?: number;
    unit: Listing['unit'];
    phone: string;
    location: Listing['location'];
    imageIds?: string[];
}
async function createListing(payload: CreateListingPayload): Promise<Listing> {
    const response = await api.post<Listing>('/listings', payload);
    return response.data;
}
async function reportListing(listingId: string, reason?: string): Promise<void> {
    await api.post(`/listings/${listingId}/report`, { reason });
}

export {
  createListing,
  reportListing,
}

export type {
  CreateListingPayload,
}
