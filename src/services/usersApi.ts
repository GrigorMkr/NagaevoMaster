import type { Review } from '@/types/listing';
import type { User } from '@/types/user';
import { USE_MOCK_FALLBACK } from '@/config/runtime';
import {
  getMockUserFromToken,
  saveMockUserSession,
} from '@/data/mock/authUsers';
import { getAuthToken } from '@/services/authApi';
import { asArray } from '@/utils/apiGuards';
import { api } from './api';

interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

interface UserReviewItem extends Review {
  listingTitle: string;
}

async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  try {
    const response = await api.patch<User>('/users/me', payload);
    return response.data;
  } catch (error) {
    if (!USE_MOCK_FALLBACK) {
      throw error;
    }

    const token = getAuthToken();
    if (!token) {
      throw error;
    }

    const currentUser = getMockUserFromToken(token);
    if (!currentUser) {
      throw error;
    }

    const updatedUser: User = {
      ...currentUser,
      ...payload,
    };

    saveMockUserSession(currentUser.email, updatedUser);
    return updatedUser;
  }
}

async function fetchMyReviews(): Promise<UserReviewItem[]> {
  try {
    const response = await api.get<UserReviewItem[]>('/users/me/reviews');
    return asArray<UserReviewItem>(response.data);
  } catch {
    return [];
  }
}

export {
  updateProfile,
  fetchMyReviews,
}

export type {
  UpdateProfilePayload,
  UserReviewItem,
}
