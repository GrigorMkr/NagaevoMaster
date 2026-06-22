import type { Listing, ListingStatus } from '@/types/listing';
import { enrichListing, enrichListings } from '@/utils/listingEnrich';
import { asArray } from '@/utils/apiGuards';
import { api } from './api';

export interface ModerationAuthorMeta {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
}

export interface ModerationListingDetail extends Listing {
  authorMeta?: ModerationAuthorMeta;
  contentViolations?: string[];
}

export interface ModerationReport {
  id: string;
  listingId: string;
  listingTitle: string;
  listingStatus: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorIsBanned: boolean;
  reporterName: string;
  reporterEmail: string;
  reason?: string;
  status: string;
  createdAt: string;
}

export interface ModerationReportDetail {
  id: string;
  listingId: string;
  listing: Listing;
  authorMeta: ModerationAuthorMeta;
  reporterName: string;
  reporterEmail: string;
  reason?: string;
  status: string;
  createdAt: string;
}

export interface ModerationRulesResponse {
  rules: string[];
  banPolicy: string;
}

function isModerationRouteMissing(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('не найден') || message.includes('Not found');
}

async function fetchModerationRules(): Promise<ModerationRulesResponse> {
  try {
    const response = await api.get<ModerationRulesResponse>('/moderation/rules');
    return response.data;
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    const { COMMUNITY_RULES, BAN_POLICY_TEXT } = await import('@/constants/communityRules');
    return { rules: [...COMMUNITY_RULES], banPolicy: BAN_POLICY_TEXT };
  }
}

async function fetchModerationListings(status: ListingStatus): Promise<Listing[]> {
  try {
    const response = await api.get<Listing[]>('/moderation/listings', { params: { status } });
    return enrichListings(asArray<Listing>(response.data));
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    if (status === 'pending') {
      const response = await api.get<Listing[]>('/listings/moderation/pending');
      return enrichListings(asArray<Listing>(response.data));
    }
    const response = await api.get<Listing[]>('/listings/moderation/listings', { params: { status } });
    return enrichListings(asArray<Listing>(response.data));
  }
}

async function fetchModerationListing(id: string): Promise<ModerationListingDetail> {
  try {
    const response = await api.get<ModerationListingDetail>(`/moderation/listings/${id}`);
    return enrichListing(response.data);
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    const response = await api.get<Listing>(`/listings/${id}`);
    return enrichListing(response.data);
  }
}

async function moderateListingStatus(
  id: string,
  status: Extract<ListingStatus, 'published' | 'rejected' | 'pending'>,
): Promise<Listing> {
  try {
    const response = await api.patch<Listing>(`/moderation/listings/${id}/status`, { status });
    return enrichListing(response.data);
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    const response = await api.patch<Listing>(`/listings/${id}/status`, { status });
    return enrichListing(response.data);
  }
}

interface AdminEditListingPayload {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  priceFrom?: number;
  unit?: string;
  phone?: string;
  imageIds?: string[];
  status?: ListingStatus;
}

async function adminEditModerationListing(
  id: string,
  payload: AdminEditListingPayload,
): Promise<ModerationListingDetail> {
  try {
    const response = await api.patch<ModerationListingDetail>(`/moderation/listings/${id}`, payload);
    return enrichListing(response.data);
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    const response = await api.patch<Listing>(`/listings/${id}`, payload);
    return enrichListing(response.data);
  }
}

async function deleteModerationListing(id: string): Promise<void> {
  try {
    await api.delete(`/moderation/listings/${id}`);
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    await api.delete(`/listings/${id}`);
  }
}

async function banModerationUser(userId: string, reason?: string): Promise<void> {
  try {
    await api.patch(`/moderation/users/${userId}/ban`, { reason });
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    throw error;
  }
}

async function unbanModerationUser(userId: string): Promise<void> {
  await api.patch(`/moderation/users/${userId}/unban`);
}

async function fetchModerationReports(status: 'pending' | 'all' = 'pending'): Promise<ModerationReport[]> {
  try {
    const response = await api.get<ModerationReport[]>('/moderation/reports', { params: { status } });
    return asArray<ModerationReport>(response.data);
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    const response = await api.get<ModerationReport[]>('/listings/moderation/reports', { params: { status } });
    return asArray<ModerationReport>(response.data);
  }
}

async function fetchModerationReport(id: string): Promise<ModerationReportDetail> {
  const response = await api.get<ModerationReportDetail>(`/moderation/reports/${id}`);
  return {
    ...response.data,
    listing: enrichListing(response.data.listing),
  };
}

interface UpdateReportOptions {
  status: 'resolved' | 'dismissed';
  rejectListing?: boolean;
  banAuthor?: boolean;
  banReason?: string;
}

async function updateReportStatus(id: string, options: UpdateReportOptions): Promise<void> {
  try {
    await api.patch(`/moderation/reports/${id}`, options);
  } catch (error) {
    if (!isModerationRouteMissing(error)) {
      throw error;
    }
    throw error;
  }
}

async function editModerationReview(
  reviewId: string,
  payload: { text?: string; rating?: number },
): Promise<void> {
  await api.patch(`/moderation/reviews/${reviewId}`, payload);
}

async function deleteModerationReview(reviewId: string): Promise<void> {
  await api.delete(`/moderation/reviews/${reviewId}`);
}

async function editModerationForumTopic(
  topicId: string,
  payload: { title?: string; content?: string },
): Promise<void> {
  await api.patch(`/moderation/forum/topics/${topicId}`, payload);
}

async function deleteModerationForumTopic(topicId: string): Promise<void> {
  await api.delete(`/moderation/forum/topics/${topicId}`);
}

async function editModerationForumPost(postId: string, content: string): Promise<void> {
  await api.patch(`/moderation/forum/posts/${postId}`, { content });
}

async function deleteModerationForumPost(postId: string): Promise<void> {
  await api.delete(`/moderation/forum/posts/${postId}`);
}

async function fetchModerationOnlineStats(): Promise<{ guestsOnline: number; usersOnline: number }> {
  const response = await api.get<{ guestsOnline: number; usersOnline: number }>('/moderation/online-stats');
  return response.data;
}

export interface AdminDashboardStats {
  generatedAt: string;
  presence: {
    guestsOnline: number;
    usersOnline: number;
    totalOnline: number;
  };
  users: {
    total: number;
    online: number;
    offline: number;
    registeredToday: number;
    banned: number;
  };
  listings: {
    total: number;
    published: number;
    pending: number;
    rejected: number;
    addedToday: number;
    servicesPublished: number;
    boardPublished: number;
    boardSalePublished: number;
    boardVacancyPublished: number;
    boardLostPublished: number;
    addedTodayServices: number;
    addedTodayBoard: number;
  };
  messages: {
    conversations: number;
    total: number;
    today: number;
  };
  forum: {
    topics: number;
    postsToday: number;
  };
  social: {
    friendships: number;
    pendingFriendRequests: number;
  };
  moderation: {
    reportsPending: number;
    listingsPending: number;
  };
  reviews: {
    total: number;
  };
  contact: {
    messagesToday: number;
  };
}

async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const response = await api.get<AdminDashboardStats>('/moderation/dashboard-stats');
  return response.data;
}

export interface ModerationUserItem {
  id: string;
  name: string;
  email: string;
  login: string;
  role: string;
  isBanned: boolean;
  phone?: string;
  createdAt: string;
}

async function fetchModerationUsers(query = ''): Promise<ModerationUserItem[]> {
  const response = await api.get<ModerationUserItem[]>('/moderation/users', {
    params: query.trim() ? { q: query.trim() } : undefined,
  });
  return asArray<ModerationUserItem>(response.data);
}

async function updateModerationUserRole(userId: string, role: string): Promise<void> {
  await api.patch(`/moderation/users/${userId}/role`, { role });
}

export interface SiteNewsItem {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  sourceUrl?: string;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SiteNewsPayload {
  title: string;
  summary?: string;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  publishedAt?: string;
}

async function fetchModerationSiteNews(): Promise<SiteNewsItem[]> {
  const response = await api.get<SiteNewsItem[]>('/moderation/site-news');
  return asArray<SiteNewsItem>(response.data);
}

async function createModerationSiteNews(payload: SiteNewsPayload): Promise<SiteNewsItem> {
  const response = await api.post<SiteNewsItem>('/moderation/site-news', payload);
  return response.data;
}

async function updateModerationSiteNews(id: string, payload: Partial<SiteNewsPayload>): Promise<SiteNewsItem> {
  const response = await api.patch<SiteNewsItem>(`/moderation/site-news/${id}`, payload);
  return response.data;
}

async function deleteModerationSiteNews(id: string): Promise<void> {
  await api.delete(`/moderation/site-news/${id}`);
}

export {
  fetchModerationRules,
  fetchModerationListings,
  fetchModerationListing,
  moderateListingStatus,
  adminEditModerationListing,
  deleteModerationListing,
  banModerationUser,
  unbanModerationUser,
  fetchModerationReports,
  fetchModerationReport,
  updateReportStatus,
  editModerationReview,
  deleteModerationReview,
  editModerationForumTopic,
  deleteModerationForumTopic,
  editModerationForumPost,
  deleteModerationForumPost,
  fetchModerationOnlineStats,
  fetchAdminDashboardStats,
  fetchModerationUsers,
  updateModerationUserRole,
  fetchModerationSiteNews,
  createModerationSiteNews,
  updateModerationSiteNews,
  deleteModerationSiteNews,
};

export type {
  AdminEditListingPayload,
  UpdateReportOptions,
  SiteNewsPayload,
};
