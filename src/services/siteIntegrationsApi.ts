import { api } from '@/services/api';

interface SiteVkWidgetsPayload {
  apiId: number | null;
  communityId: number | null;
  videoUrl: string | null;
  videoOid: string | null;
  videoId: string | null;
  videoHash: string | null;
  wallPostOwnerId: number | null;
  wallPostId: number | null;
  wallPostHash: string | null;
  contactUsText: string;
}

interface SiteIntegrationsPayload {
  vkWidgets: SiteVkWidgetsPayload;
  vkMaps: {
    mapToken: string | null;
  };
}

async function fetchSiteIntegrations(): Promise<SiteIntegrationsPayload> {
  const response = await api.get<SiteIntegrationsPayload>('/site/integrations');
  return response.data;
}

export type {
  SiteIntegrationsPayload,
  SiteVkWidgetsPayload,
};

export {
  fetchSiteIntegrations,
};
