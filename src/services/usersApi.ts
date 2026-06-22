import type { Review } from '@/types/listing';
import type { Listing } from '@/types/listing';
import type { User } from '@/types/user';
import { USE_MOCK_FALLBACK } from '@/config/runtime';
import {
  getMockUserFromToken,
  saveMockUserSession,
} from '@/data/mock/authUsers';
import { getAuthToken } from '@/services/authApi';
import { asArray } from '@/utils/apiGuards';
import { api } from './api';

import type { HomeLocation } from '@/types/location';

interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  birthYear?: number | null;
  homeAddress?: string | null;
  homeLat?: number | null;
  homeLng?: number | null;
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
      name: payload.name ?? currentUser.name,
      phone: payload.phone ?? currentUser.phone,
      avatarUrl: payload.avatarUrl ?? currentUser.avatarUrl,
      birthYear: payload.birthYear === null ? undefined : (payload.birthYear ?? currentUser.birthYear),
      homeLocation: payload.homeAddress === null
        ? undefined
        : (payload.homeLat != null && payload.homeLng != null && payload.homeAddress
          ? { lat: payload.homeLat, lng: payload.homeLng, address: payload.homeAddress }
          : currentUser.homeLocation),
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

async function saveUserLocation(location: import('@/types/location').AccountLocation): Promise<void> {
  await api.patch('/users/me/location', {
    lat: location.lat,
    lng: location.lng,
    label: location.label,
  });
}

async function clearUserLocation(): Promise<void> {
  await api.delete('/users/me/location');
}

interface PublicUserProfile {
  user: {
    id: string;
    name: string;
    login: string;
    avatarUrl?: string;
    phone?: string;
    email?: string;
    birthYear?: number;
    homeLocation?: HomeLocation;
  };
  listings: Listing[];
}

async function fetchUserPublicProfile(userId: string): Promise<PublicUserProfile> {
  const response = await api.get<PublicUserProfile>(`/users/${userId}/profile`);
  return response.data;
}

export {
  updateProfile,
  fetchMyReviews,
  saveUserLocation,
  clearUserLocation,
  fetchUserPublicProfile,
}

export type {
  UpdateProfilePayload,
  UserReviewItem,
  PublicUserProfile,
}
