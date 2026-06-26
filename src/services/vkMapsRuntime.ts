import mmrgl from 'mmr-gl';
import { VK_MAPS_BASE_URL } from '@/constants/vkMaps';

let configured = false;

function configureVkMaps(): boolean {
  if (configured) {
    return Boolean(mmrgl.accessToken);
  }

  const token = import.meta.env.VITE_MAP_TOKEN?.trim();
  if (!token) {
    console.warn('[vk-maps] VITE_MAP_TOKEN не задан — карта может не загрузиться');
    return false;
  }

  mmrgl.baseApiUrl = VK_MAPS_BASE_URL;
  mmrgl.accessToken = token;
  configured = true;
  return true;
}

export {
  configureVkMaps,
};
