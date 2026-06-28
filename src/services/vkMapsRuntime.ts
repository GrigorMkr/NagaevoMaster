import mmrgl from 'mmr-gl';
import { VK_MAPS_BASE_URL } from '@/constants/vkMaps';
import { isNativeApp } from '@/utils/nativeApp';
import { fetchSiteIntegrations } from '@/services/siteIntegrationsApi';

let configured = false;
let runtimeToken: string | null = null;
let tokenPromise: Promise<string | null> | null = null;

function getBuildTimeToken(): string | null {
  const token = import.meta.env.VITE_MAP_TOKEN?.trim();
  return token || null;
}

function applyRuntimeVkMapsToken(token: string): void {
  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }
  runtimeToken = trimmed;
  if (configured) {
    mmrgl.accessToken = trimmed;
  }
}

function resolveMapToken(): string | null {
  return runtimeToken ?? getBuildTimeToken();
}

async function loadMapTokenFromApi(): Promise<string | null> {
  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = fetchSiteIntegrations()
    .then((payload) => {
      const token = payload.vkMaps.mapToken?.trim() || null;
      if (token) {
        applyRuntimeVkMapsToken(token);
      }
      return token;
    })
    .catch(() => null)
    .finally(() => {
      tokenPromise = null;
    });

  return tokenPromise;
}

function configureVkMaps(): boolean {
  const token = resolveMapToken();
  if (!token) {
    void loadMapTokenFromApi().then((apiToken) => {
      if (apiToken) {
        configureVkMaps();
      }
    });
    console.warn('[vk-maps] VITE_MAP_TOKEN не задан — пробуем загрузить с API');
    return false;
  }

  if (configured && mmrgl.accessToken === token) {
    return true;
  }

  mmrgl.baseApiUrl = VK_MAPS_BASE_URL;
  mmrgl.accessToken = token;

  if (isNativeApp() && typeof mmrgl.workerCount === 'number') {
    mmrgl.workerCount = 2;
  }

  configured = true;
  return true;
}

function prewarmVkMaps(): void {
  if (!configureVkMaps()) {
    return;
  }
  try {
    if (typeof mmrgl.prewarm === 'function') {
      mmrgl.prewarm();
    }
  } catch {
    // ignore — prewarm is optional
  }
}

function isVkMapsConfigured(): boolean {
  return Boolean(resolveMapToken());
}

async function ensureVkMapsReady(): Promise<boolean> {
  if (configureVkMaps()) {
    return true;
  }
  const token = await loadMapTokenFromApi();
  return token ? configureVkMaps() : false;
}

export {
  applyRuntimeVkMapsToken,
  configureVkMaps,
  ensureVkMapsReady,
  isVkMapsConfigured,
  prewarmVkMaps,
};
