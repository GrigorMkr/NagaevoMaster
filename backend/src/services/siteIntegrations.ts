import { env } from '../config/env.js';

function readInt(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function buildSiteIntegrations() {
  const apiId = readInt(env.VK_CLIENT_ID);
  const communityId = readInt(env.VK_COMMUNITY_ID);

  return {
    vkWidgets: {
      apiId: apiId !== null && apiId > 0 ? apiId : null,
      communityId: communityId !== null && communityId !== 0 ? communityId : null,
      videoUrl: env.VK_VIDEO_URL?.trim() || null,
      videoOid: env.VK_VIDEO_OID?.trim() || null,
      videoId: env.VK_VIDEO_ID?.trim() || null,
      videoHash: env.VK_VIDEO_HASH?.trim() || null,
      wallPostOwnerId: readInt(env.VK_WALL_POST_OWNER_ID),
      wallPostId: readInt(env.VK_WALL_POST_ID),
      wallPostHash: env.VK_WALL_POST_HASH?.trim() || null,
      contactUsText: env.VK_CONTACT_US_TEXT?.trim() || 'Напишите нам',
    },
    vkMaps: {
      mapToken: env.VK_MAPS_API_KEY?.trim() || null,
    },
  };
}

export {
  buildSiteIntegrations,
};
