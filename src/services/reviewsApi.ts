import { USE_MOCK_FALLBACK } from '@/config/runtime';
import { getReviewsForListing } from '@/data/mock/reviews';
import type { Review } from '@/types/listing';
import { asArray } from '@/utils/apiGuards';
import { api } from './api';
type ReviewListItem = Review;
async function fetchListingReviews(listingId: string): Promise<ReviewListItem[]> {
    try {
        const response = await api.get<ReviewListItem[]>(`/listings/${listingId}/reviews`);
        return asArray<ReviewListItem>(response.data);
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        return getReviewsForListing(listingId).map((review) => ({
            id: review.id,
            listingId: review.listingId,
            userId: 'mock',
            authorName: review.authorName,
            rating: review.rating,
            text: review.text,
            createdAt: review.createdAt,
        }));
    }
}
async function createListingReview(
    listingId: string,
    data: {
        rating: number;
        text: string;
    },
    authorName: string,
): Promise<ReviewListItem> {
    try {
        const response = await api.post<ReviewListItem>(`/listings/${listingId}/reviews`, data);
        return response.data;
    }
    catch (error) {
        if (!USE_MOCK_FALLBACK)
            throw error;
        return {
            id: `mock-review-${Date.now()}`,
            listingId,
            userId: 'mock',
            authorName,
            rating: data.rating,
            text: data.text,
            createdAt: new Date().toISOString(),
        };
    }
}

export {
  fetchListingReviews,
  createListingReview,
}

export type {
  ReviewListItem,
}
