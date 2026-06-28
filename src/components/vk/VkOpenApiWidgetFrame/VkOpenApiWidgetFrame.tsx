import { useCallback, useRef } from 'react';
import { useVkOpenApiWidget } from '@/hooks/useVkOpenApiWidget';
import type { VkOpenApi } from '@/types/vkOpenApi';
import widgetStyles from '../vkWidgets.module.css';

interface VkOpenApiWidgetFrameProps {
  enabled?: boolean;
  className?: string;
  onMount: (vk: VkOpenApi, containerId: string) => void;
}

function VkOpenApiWidgetFrame({ enabled = true, className, onMount }: VkOpenApiWidgetFrameProps) {
  const onMountRef = useRef(onMount);
  onMountRef.current = onMount;

  const mount = useCallback((vk: VkOpenApi, containerId: string) => {
    onMountRef.current(vk, containerId);
  }, []);

  const { containerId, ready, error } = useVkOpenApiWidget({ enabled, mount });

  if (!enabled) {
    return null;
  }

  return (
    <div className={className}>
      <div id={containerId} className={widgetStyles.vkWidgetFrame} />
      {!ready && !error && (
        <p className={widgetStyles.vkWidgetLoading}>Загрузка виджета VK…</p>
      )}
      {error && <p className={widgetStyles.vkWidgetError}>{error}</p>}
    </div>
  );
}

export {
  VkOpenApiWidgetFrame,
};
