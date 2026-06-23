import type { ChatMessage } from '@/types/message';
import { api } from './api';
import type { GroupDetail, GroupMember } from '@/types/message';

interface CreateGroupPayload {
  name: string;
  memberIds: string[];
  avatarUrl?: string;
}

interface UpdateGroupPayload {
  name?: string;
  avatarUrl?: string | null;
}

interface GroupSearchResult {
  query: string;
  results: ChatMessage[];
}

async function createGroup(payload: CreateGroupPayload): Promise<GroupDetail> {
  const response = await api.post<GroupDetail>('/groups', payload);
  return response.data;
}

async function fetchGroup(groupId: string): Promise<GroupDetail> {
  const response = await api.get<GroupDetail>(`/groups/${groupId}`);
  return response.data;
}

async function updateGroup(groupId: string, payload: UpdateGroupPayload): Promise<GroupDetail> {
  const response = await api.patch<GroupDetail>(`/groups/${groupId}`, payload);
  return response.data;
}

async function addGroupMembers(groupId: string, memberIds: string[]): Promise<GroupDetail> {
  const response = await api.post<GroupDetail>(`/groups/${groupId}/members`, { memberIds });
  return response.data;
}

async function leaveGroup(groupId: string, userId: string): Promise<void> {
  await api.delete(`/groups/${groupId}/members/${userId}`);
}

async function removeGroupMember(groupId: string, userId: string): Promise<GroupDetail> {
  const response = await api.delete<GroupDetail>(`/groups/${groupId}/members/${userId}`);
  return response.data;
}

async function reportGroup(groupId: string, reason?: string): Promise<void> {
  await api.post(`/groups/${groupId}/report`, { reason });
}

async function searchGroupMessages(groupId: string, query: string): Promise<GroupSearchResult> {
  const response = await api.get<GroupSearchResult>(`/groups/${groupId}/search`, {
    params: { q: query },
  });
  return response.data;
}

function isGroupAdmin(role: string) {
  return role === 'owner' || role === 'admin';
}

function groupRoleLabel(role: string) {
  if (role === 'owner') return 'Создатель';
  if (role === 'admin') return 'Админ';
  return '';
}

export {
  createGroup,
  fetchGroup,
  updateGroup,
  addGroupMembers,
  leaveGroup,
  removeGroupMember,
  reportGroup,
  searchGroupMessages,
  isGroupAdmin,
  groupRoleLabel,
};

export type {
  CreateGroupPayload,
  UpdateGroupPayload,
  GroupSearchResult,
  GroupMember,
};
