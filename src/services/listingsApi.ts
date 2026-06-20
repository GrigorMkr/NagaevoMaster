import type { Listing, ListingStatus, PriceUnit } from '@/types/listing';
import type { SearchParams } from '@/types/search';
import { DEGREES_IN_SEMICIRCLE, EARTH_RADIUS_KM } from '@/constants/geo';
import { NAGAEVO_CENTER } from '@/constants/geo-data';
import { MOCK_LISTINGS } from '@/data/mockListings';
import { USE_MOCK_FALLBACK } from '@/config/runtime';
import { SortBy } from '@/enums/sort';
import { enrichListing, enrichListings } from '@/utils/listingEnrich';
import { resolveUploadUrl } from '@/utils/mediaUrl';
import { asArray } from '@/utils/apiGuards';
import { api } from './api';
import {
  fetchModerationListings,
  moderateListingStatus,
} from './moderationApi';
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRadians = (value: number) => (value * Math.PI) / DEGREES_IN_SEMICIRCLE;
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLng = toRadians(lng2 - lng1);
    const a = Math.sin(deltaLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
interface ListingsResponse {
    items: Listing[];
    totalPages: number;
    page: number;
}
function resolveSearchOrigin(params: Partial<SearchParams>) {
    if (params.originLat != null && params.originLng != null) {
        return { lat: params.originLat, lng: params.originLng };
    }
    return NAGAEVO_CENTER;
}
function distanceFromOrigin(listing: Listing, origin: {
    lat: number;
    lng: number;
}): number {
    return getDistanceKm(origin.lat, origin.lng, listing.location.lat, listing.location.lng);
}
function filterMockListings(params: Partial<SearchParams>): Listing[] {
    const origin = resolveSearchOrigin(params);
    let result = [...MOCK_LISTINGS];
    if (params.query) {
        const q = params.query.toLowerCase();
        result = result.filter((l) => l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.subcategory.toLowerCase().includes(q));
    }
    if (params.category) {
        result = result.filter((l) => l.category === params.category);
    }
    if (params.subcategory) {
        result = result.filter((l) => l.subcategory === params.subcategory);
    }
    if (params.rating && params.rating > 0) {
        result = result.filter((listing) => listing.rating >= params.rating!);
    }
    if (params.priceMin !== null && params.priceMin !== undefined) {
        result = result.filter((listing) => listing.priceFrom >= params.priceMin!);
    }
    if (params.priceMax !== null && params.priceMax !== undefined) {
        result = result.filter((listing) => listing.priceFrom <= params.priceMax!);
    }
    if (params.distance) {
        result = result.filter((listing) => distanceFromOrigin(listing, origin) <= params.distance!);
    }
    if (params.sortBy === SortBy.Distance) {
        result.sort((a, b) => distanceFromOrigin(a, origin) - distanceFromOrigin(b, origin));
    }
    else if (params.sortBy === SortBy.PriceAsc) {
        result.sort((a, b) => a.priceFrom - b.priceFrom);
    }
    else if (params.sortBy === SortBy.PriceDesc) {
        result.sort((a, b) => b.priceFrom - a.priceFrom);
    }
    else if (params.sortBy === SortBy.Newest) {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    else {
        result.sort((a, b) => b.rating - a.rating);
    }
    return result;
}
function isListingsResponse(data: unknown): data is ListingsResponse {
    return (typeof data === 'object' &&
        data !== null &&
        Array.isArray((data as ListingsResponse).items));
}
function mockListingsResponse(params: Partial<SearchParams>): ListingsResponse {
    return {
        items: enrichListings(filterMockListings(params)),
        totalPages: 1,
        page: params.page ?? 1,
    };
}
async function fetchListings(params: Partial<SearchParams> = {}): Promise<ListingsResponse> {
    try {
        const response = await api.get<ListingsResponse>('/listings', { params });
        if (!isListingsResponse(response.data)) {
            throw new Error('Invalid listings response');
        }
        const items = enrichListings(response.data.items);
        if (USE_MOCK_FALLBACK && items.length === 0) {
            return mockListingsResponse(params);
        }
        return {
            ...response.data,
            items,
        };
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        return mockListingsResponse(params);
    }
}
async function fetchMyListings(userId: string): Promise<Listing[]> {
    try {
        const response = await api.get<Listing[]>('/users/me/listings');
        return enrichListings(asArray<Listing>(response.data));
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        return enrichListings(MOCK_LISTINGS.filter((listing) => listing.userId === userId));
    }
}
async function fetchListingById(id: string): Promise<Listing | null> {
    try {
        const response = await api.get<Listing>(`/listings/${id}`);
        const listing = response.data;
        if (!listing || typeof listing !== 'object' || !('id' in listing)) {
            throw new Error('Invalid listing response');
        }
        return enrichListing(listing);
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        const listing = MOCK_LISTINGS.find((item) => item.id === id);
        return listing ? enrichListing(listing) : null;
    }
}

interface CreateListingPayload {
    category: string;
    subcategory: string;
    title: string;
    description: string;
    priceFrom: number;
    unit: PriceUnit;
    phone: string;
    location: { lat: number; lng: number; address: string };
    imageIds?: string[];
}

async function uploadListingImage(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<{ id: string; url: string }>('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resolveUploadUrl(response.data.url);
}

async function createListing(payload: CreateListingPayload): Promise<Listing> {
    const response = await api.post<Listing>('/listings', payload);
    return enrichListing(response.data);
}

async function fetchPendingListings(): Promise<Listing[]> {
    try {
        return await fetchModerationListings('pending');
    }
    catch {
        const response = await api.get<Listing[]>('/listings/moderation/pending');
        return enrichListings(asArray<Listing>(response.data));
    }
}

async function moderateListing(id: string, status: Extract<ListingStatus, 'published' | 'rejected'>): Promise<Listing> {
    try {
        return await moderateListingStatus(id, status);
    }
    catch {
        const response = await api.patch<Listing>(`/listings/${id}/status`, { status });
        return enrichListing(response.data);
    }
}

export {
  fetchListings,
  fetchListingById,
  fetchMyListings,
  uploadListingImage,
  createListing,
  fetchPendingListings,
  moderateListing,
}

export type {
  ListingsResponse,
  CreateListingPayload,
}
