import { useSyncExternalStore } from 'react';
import { getVkWidgetsState, subscribeVkWidgets } from '@/services/vkWidgetsRuntime';

const VK_OPENAPI_SCRIPT_URL = 'https://vk.ru/js/api/openapi.js?169';

function useVkWidgets() {
  return useSyncExternalStore(subscribeVkWidgets, getVkWidgetsState, getVkWidgetsState);
}

function isVkWidgetsConfigured(): boolean {
  const { apiId } = getVkWidgetsState();
  return apiId !== null && apiId > 0;
}

function isVkCommunityConfigured(): boolean {
  const { communityId } = getVkWidgetsState();
  return communityId !== null && communityId !== 0;
}

function isVkVideoConfigured(): boolean {
  return getVkWidgetsState().video !== null;
}

function isVkWallPostConfigured(): boolean {
  const { wallPostOwnerId, wallPostId, wallPostHash } = getVkWidgetsState();
  return (
    wallPostOwnerId !== null
    && wallPostId !== null
    && wallPostId > 0
    && Boolean(wallPostHash)
  );
}

function getVkCommunityUrl(ownerId?: number | null): string | null {
  const id = ownerId ?? getVkWidgetsState().communityId;
  if (id === null || id === undefined || id === 0) {
    return null;
  }
  const slug = Math.abs(id);
  return `https://vk.ru/public${slug}`;
}

function getVkCommunityMeUrl(ownerId?: number | null): string | null {
  const id = ownerId ?? getVkWidgetsState().communityId;
  if (id === null || id === undefined || id === 0) {
    return null;
  }
  return `https://vk.me/public${Math.abs(id)}`;
}

export {
  VK_OPENAPI_SCRIPT_URL,
  useVkWidgets,
  isVkWidgetsConfigured,
  isVkCommunityConfigured,
  isVkVideoConfigured,
  isVkWallPostConfigured,
  getVkCommunityUrl,
  getVkCommunityMeUrl,
};
