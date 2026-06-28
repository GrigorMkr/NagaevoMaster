import { useVkWidgets } from '@/constants/vkWidgets';
import { VkOpenApiWidgetFrame } from '../VkOpenApiWidgetFrame/VkOpenApiWidgetFrame';

interface VkContactUsWidgetProps {
  ownerId?: number;
  text?: string;
  height?: number;
  className?: string;
}

function VkContactUsWidget({
  ownerId,
  text,
  height = 24,
  className,
}: VkContactUsWidgetProps) {
  const config = useVkWidgets();
  const resolvedOwnerId = ownerId ?? config.communityId ?? undefined;
  const resolvedText = text ?? config.contactUsText;
  const enabled = config.apiId !== null
    && config.communityId !== null
    && resolvedOwnerId !== undefined;

  return (
    <VkOpenApiWidgetFrame
      enabled={enabled}
      className={className}
      onMount={(vk, containerId) => {
        vk.Widgets.ContactUs(containerId, { text: resolvedText, height }, resolvedOwnerId!);
      }}
    />
  );
}

export {
  VkContactUsWidget,
};
