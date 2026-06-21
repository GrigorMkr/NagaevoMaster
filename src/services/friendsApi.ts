import { api } from './api';
import type { FriendEntry, FriendSearchResult, FriendsOverview, FriendRelation } from '@/types/friend';

async function fetchFriendsOverview(): Promise<FriendsOverview> {
  const response = await api.get<FriendsOverview>('/friends');
  return response.data;
}

async function searchFriends(query: string): Promise<FriendSearchResult[]> {
  const response = await api.get<FriendSearchResult[]>('/friends/search', { params: { q: query } });
  return response.data;
}

async function fetchFriendRelation(userId: string): Promise<{ relation: FriendRelation; friendshipId?: string }> {
  const response = await api.get<{ relation: FriendRelation; friendshipId?: string }>(`/friends/with/${userId}`);
  return response.data;
}

async function sendFriendRequest(userId: string): Promise<FriendEntry> {
  const response = await api.post<FriendEntry>('/friends/request', { userId });
  return response.data;
}

async function acceptFriendRequest(friendshipId: string): Promise<FriendEntry> {
  const response = await api.post<FriendEntry>(`/friends/${friendshipId}/accept`);
  return response.data;
}

async function removeFriendship(friendshipId: string): Promise<void> {
  await api.delete(`/friends/${friendshipId}`);
}

export {
  fetchFriendsOverview,
  searchFriends,
  fetchFriendRelation,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
}
