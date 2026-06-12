import { USE_MOCK_FALLBACK } from '@/config/runtime';
import { getReviewsForListing } from '@/data/mock/reviews';
import type { Review } from '@/types/listing';
import { api } from './api';
type ReviewListItem = Review;
async function fetchListingReviews(listingId: string): Promise<ReviewListItem[]> {
    try {
        const response = await api.get<ReviewListItem[]>(`/listings/${listingId}/reviews`);
        return response.data;
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
async function createListingReview(listingId: string, data: {
    rating: number;
    text: string;
}): Promise<ReviewListItem> {
    const response = await api.post<ReviewListItem>(`/listings/${listingId}/reviews`, data);
    return response.data;
}

export {
  fetchListingReviews,
  createListingReview,
}

export type {
  ReviewListItem,
}
