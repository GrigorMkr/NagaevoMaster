import { isVkWidgetsConfigured } from '@/constants/vkWidgets';
import type { VkWidgetOptions } from '@/types/vkOpenApi';
import { VkOpenApiWidgetFrame } from '../VkOpenApiWidgetFrame/VkOpenApiWidgetFrame';

interface VkCommentsWidgetProps {
  options?: VkWidgetOptions;
  pageId?: string | number;
  className?: string;
}

function VkCommentsWidget({ options, pageId, className }: VkCommentsWidgetProps) {
  return (
    <VkOpenApiWidgetFrame
      enabled={isVkWidgetsConfigured()}
      className={className}
      onMount={(vk, containerId) => {
        if (pageId !== undefined) {
          vk.Widgets.Comments(containerId, options, pageId);
          return;
        }
        vk.Widgets.Comments(containerId, options);
      }}
    />
  );
}

export {
  VkCommentsWidget,
};
