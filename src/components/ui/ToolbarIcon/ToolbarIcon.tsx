import { memo } from 'react';
import { RichIcon } from '@/components/ui/RichIcon';
import type { AppIconName } from '@/types/icon';
import type { RichIconMotion } from '@/components/ui/RichIcon';

interface ToolbarIconProps {
  name: AppIconName;
  accent?: string;
  accent2?: string;
  motion?: RichIconMotion;
  className?: string;
}

const ToolbarIcon = memo(function ToolbarIcon({
  name,
  accent = '#7ec8a8',
  accent2,
  motion = 'pulse',
  className,
}: ToolbarIconProps) {
  return (
    <RichIcon
      name={name}
      variant="inline"
      size="sm"
      accent={accent}
      accent2={accent2}
      motion={motion}
      className={className}
    />
  );
});

export {
  ToolbarIcon,
};
