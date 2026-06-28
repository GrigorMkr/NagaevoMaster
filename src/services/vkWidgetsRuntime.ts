import { parseVkVideoConfig, type VkVideoParams } from '@/utils/parseVkVideo';
import type { SiteVkWidgetsPayload } from '@/services/siteIntegrationsApi';

interface VkWidgetsState {
  apiId: number | null;
  communityId: number | null;
  video: VkVideoParams | null;
  wallPostOwnerId: number | null;
  wallPostId: number | null;
  wallPostHash: string | undefined;
  contactUsText: string;
}

function readEnv(name: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[name];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readIntEnv(name: keyof ImportMetaEnv): number | null {
  const raw = readEnv(name);
  if (!raw) {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function buildInitialState(): VkWidgetsState {
  return {
    apiId: readIntEnv('VITE_VK_WIDGETS_API_ID'),
    communityId: readIntEnv('VITE_VK_COMMUNITY_ID'),
    video: parseVkVideoConfig({
      url: readEnv('VITE_VK_VIDEO_URL'),
      oid: readEnv('VITE_VK_VIDEO_OID'),
      id: readEnv('VITE_VK_VIDEO_ID'),
      hash: readEnv('VITE_VK_VIDEO_HASH'),
      hd: readEnv('VITE_VK_VIDEO_HD'),
      autoplay: readEnv('VITE_VK_VIDEO_AUTOPLAY'),
      loop: readEnv('VITE_VK_VIDEO_LOOP'),
      startTime: readEnv('VITE_VK_VIDEO_START'),
    }),
    wallPostOwnerId: readIntEnv('VITE_VK_WALL_POST_OWNER_ID'),
    wallPostId: readIntEnv('VITE_VK_WALL_POST_ID'),
    wallPostHash: readEnv('VITE_VK_WALL_POST_HASH'),
    contactUsText: readEnv('VITE_VK_CONTACT_US_TEXT') ?? 'Напишите нам',
  };
}

let state = buildInitialState();
const listeners = new Set<() => void>();

function getVkWidgetsState(): VkWidgetsState {
  return state;
}

function subscribeVkWidgets(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function applyRuntimeVkWidgets(payload: SiteVkWidgetsPayload): void {
  const video = parseVkVideoConfig({
    url: payload.videoUrl ?? undefined,
    oid: payload.videoOid ?? undefined,
    id: payload.videoId ?? undefined,
    hash: payload.videoHash ?? undefined,
  });

  state = {
    apiId: payload.apiId ?? state.apiId,
    communityId: payload.communityId ?? state.communityId,
    video: video ?? state.video,
    wallPostOwnerId: payload.wallPostOwnerId ?? state.wallPostOwnerId,
    wallPostId: payload.wallPostId ?? state.wallPostId,
    wallPostHash: payload.wallPostHash ?? state.wallPostHash,
    contactUsText: payload.contactUsText || state.contactUsText,
  };

  listeners.forEach((listener) => listener());
}

export type {
  VkWidgetsState,
};

export {
  applyRuntimeVkWidgets,
  getVkWidgetsState,
  subscribeVkWidgets,
};
