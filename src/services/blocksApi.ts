import { api } from './api';

async function fetchBlockedUsers() {
  const response = await api.get<Array<{
    id: string;
    user: { id: string; name: string; login: string; avatarUrl?: string };
    createdAt: string;
  }>>('/blocks');
  return response.data;
}

async function fetchBlockStatus(userId: string) {
  const response = await api.get<{ blockedByMe: boolean; blockedMe: boolean; blockId?: string }>(
    `/blocks/with/${userId}`,
  );
  return response.data;
}

async function blockUser(userId: string) {
  const response = await api.post('/blocks', { userId });
  return response.data;
}

async function unblockUser(userId: string) {
  await api.delete(`/blocks/${userId}`);
}

export {
  fetchBlockedUsers,
  fetchBlockStatus,
  blockUser,
  unblockUser,
}
