import { useEffect, useId, useRef, useState } from 'react';
import { ensureVkOpenApi } from '@/services/vkOpenApi';
import type { VkOpenApi } from '@/types/vkOpenApi';

interface UseVkOpenApiWidgetOptions {
  enabled?: boolean;
  mount: (vk: VkOpenApi, containerId: string) => void;
}

function useVkOpenApiWidget({ enabled = true, mount }: UseVkOpenApiWidgetOptions) {
  const reactId = useId();
  const containerId = `vk_widget_${reactId.replace(/:/g, '')}`;
  const mountRef = useRef(mount);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  mountRef.current = mount;

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      setError(null);
      return;
    }

    let cancelled = false;

    ensureVkOpenApi()
      .then((vk) => {
        if (cancelled) {
          return;
        }
        mountRef.current(vk, containerId);
        setReady(true);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return;
        }
        setReady(false);
        setError(cause instanceof Error ? cause.message : 'Не удалось загрузить виджет VK');
      });

    return () => {
      cancelled = true;
    };
  }, [containerId, enabled]);

  return { containerId, ready, error };
}

export {
  useVkOpenApiWidget,
};
