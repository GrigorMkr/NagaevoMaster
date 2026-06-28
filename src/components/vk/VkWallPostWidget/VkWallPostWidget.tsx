import { useVkWidgets } from '@/constants/vkWidgets';
import type { VkWidgetOptions } from '@/types/vkOpenApi';
import { VkOpenApiWidgetFrame } from '../VkOpenApiWidgetFrame/VkOpenApiWidgetFrame';

interface VkWallPostWidgetProps {
  ownerId?: number;
  postId?: number;
  hash?: string;
  options?: VkWidgetOptions;
  className?: string;
}

function VkWallPostWidget({
  ownerId,
  postId,
  hash,
  options,
  className,
}: VkWallPostWidgetProps) {
  const config = useVkWidgets();
  const resolvedOwnerId = ownerId ?? config.wallPostOwnerId ?? undefined;
  const resolvedPostId = postId ?? config.wallPostId ?? undefined;
  const resolvedHash = hash ?? config.wallPostHash;
  const enabled = config.apiId !== null
    && resolvedOwnerId !== undefined
    && resolvedPostId !== undefined
    && Boolean(resolvedHash);

  return (
    <VkOpenApiWidgetFrame
      enabled={enabled}
      className={className}
      onMount={(vk, containerId) => {
        vk.Widgets.Post(containerId, resolvedOwnerId!, resolvedPostId!, resolvedHash!, options);
      }}
    />
  );
}

export {
  VkWallPostWidget,
};
