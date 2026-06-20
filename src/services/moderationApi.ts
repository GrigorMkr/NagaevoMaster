import type { Listing, ListingStatus } from '@/types/listing';
import { enrichListing, enrichListings } from '@/utils/listingEnrich';
import { asArray } from '@/utils/apiGuards';
import { api } from './api';

export interface ModerationReport {
    id: string;
    listingId: string;
    listingTitle: string;
    listingStatus: string;
    reporterName: string;
    reporterEmail: string;
    reason?: string;
    status: string;
    createdAt: string;
}

async function fetchModerationListings(status: ListingStatus): Promise<Listing[]> {
    const response = await api.get<Listing[]>('/moderation/listings', { params: { status } });
    return enrichListings(asArray<Listing>(response.data));
}

async function moderateListingStatus(
    id: string,
    status: Extract<ListingStatus, 'published' | 'rejected'>,
): Promise<Listing> {
    const response = await api.patch<Listing>(`/moderation/listings/${id}/status`, { status });
    return enrichListing(response.data);
}

async function fetchModerationReports(status: 'pending' | 'all' = 'pending'): Promise<ModerationReport[]> {
    const response = await api.get<ModerationReport[]>('/moderation/reports', { params: { status } });
    return asArray<ModerationReport>(response.data);
}

async function updateReportStatus(
    id: string,
    status: 'resolved' | 'dismissed',
): Promise<void> {
    await api.patch(`/moderation/reports/${id}`, { status });
}

export {
  fetchModerationListings,
  moderateListingStatus,
  fetchModerationReports,
  updateReportStatus,
}
