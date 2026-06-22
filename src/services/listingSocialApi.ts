import { api } from './api';

type ListingReactionValue = 1 | -1 | 0;

interface ListingReactionResult {
  listingId: string;
  value: 1 | -1 | null;
  likesCount: number;
  dislikesCount: number;
}

interface ListingRepostResult {
  listingId: string;
  recipientIds: string[];
  repostsCount: number;
}

async function fetchMyListingReactions(): Promise<Record<string, 1 | -1>> {
  const response = await api.get<Record<string, 1 | -1>>('/listing-social/reactions');
  return response.data;
}

async function setListingReaction(
  listingId: string,
  value: ListingReactionValue,
): Promise<ListingReactionResult> {
  const response = await api.put<ListingReactionResult>(`/listing-social/${listingId}/reaction`, { value });
  return response.data;
}

async function repostListing(
  listingId: string,
  recipientIds: string[],
): Promise<ListingRepostResult> {
  const response = await api.post<ListingRepostResult>(`/listing-social/${listingId}/repost`, { recipientIds });
  return response.data;
}

export {
  fetchMyListingReactions,
  setListingReaction,
  repostListing,
};

export type {
  ListingReactionValue,
  ListingReactionResult,
  ListingRepostResult,
};
