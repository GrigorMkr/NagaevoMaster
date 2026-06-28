import { isVkWidgetsConfigured } from '@/constants/vkWidgets';
import type { VkWidgetOptions } from '@/types/vkOpenApi';
import { VkOpenApiWidgetFrame } from '../VkOpenApiWidgetFrame/VkOpenApiWidgetFrame';

interface VkLikeWidgetProps {
  options?: VkWidgetOptions;
  pageId?: string | number;
  className?: string;
}

function VkLikeWidget({ options, pageId, className }: VkLikeWidgetProps) {
  return (
    <VkOpenApiWidgetFrame
      enabled={isVkWidgetsConfigured()}
      className={className}
      onMount={(vk, containerId) => {
        if (pageId !== undefined) {
          vk.Widgets.Like(containerId, options, pageId);
          return;
        }
        vk.Widgets.Like(containerId, options);
      }}
    />
  );
}

export {
  VkLikeWidget,
};
