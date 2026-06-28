import {
  VK_OPENAPI_SCRIPT_URL,
  isVkWidgetsConfigured,
} from '@/constants/vkWidgets';
import { getVkWidgetsState } from '@/services/vkWidgetsRuntime';
import type { VkOpenApi } from '@/types/vkOpenApi';

const SCRIPT_ID = 'vk-openapi-script';

let scriptPromise: Promise<void> | null = null;
let initPromise: Promise<VkOpenApi> | null = null;

function resetVkOpenApiInit(): void {
  initPromise = null;
}

function loadVkOpenApiScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('VK Open API недоступен'));
  }
  if (window.VK) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Не удалось загрузить VK Open API')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = VK_OPENAPI_SCRIPT_URL;
    script.async = true;
    script.charset = 'windows-1251';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить VK Open API'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function ensureVkOpenApi(): Promise<VkOpenApi> {
  const apiId = getVkWidgetsState().apiId;
  if (!isVkWidgetsConfigured() || apiId === null) {
    return Promise.reject(new Error('VK Widgets API ID не настроен'));
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = loadVkOpenApiScript().then(() => {
    const currentApiId = getVkWidgetsState().apiId;
    if (currentApiId === null) {
      throw new Error('VK Widgets API ID не настроен');
    }
    const vk = window.VK;
    if (!vk) {
      throw new Error('VK Open API не инициализировался');
    }
    vk.init({ apiId: currentApiId, onlyWidgets: true });
    return vk;
  });

  return initPromise;
}

export {
  ensureVkOpenApi,
  resetVkOpenApiInit,
};
