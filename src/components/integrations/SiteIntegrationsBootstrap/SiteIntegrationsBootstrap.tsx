import { useEffect } from 'react';
import { applyRuntimeVkWidgets } from '@/services/vkWidgetsRuntime';
import { applyRuntimeVkMapsToken } from '@/services/vkMapsRuntime';
import { fetchSiteIntegrations } from '@/services/siteIntegrationsApi';

function SiteIntegrationsBootstrap() {
  useEffect(() => {
    let cancelled = false;

    void fetchSiteIntegrations()
      .then((payload) => {
        if (cancelled) {
          return;
        }
        applyRuntimeVkWidgets(payload.vkWidgets);
        if (payload.vkMaps.mapToken) {
          applyRuntimeVkMapsToken(payload.vkMaps.mapToken);
        }
      })
      .catch(() => {
        // Сборка может работать только с VITE_* — API опционален
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export {
  SiteIntegrationsBootstrap,
};
