import { memo, useId, type CSSProperties } from 'react';
import classNames from 'classnames';
import type { AppIconName } from '@/types/icon';
import { ICON_REGISTRY } from './iconRegistry';
import styles from './RichIcon.module.css';

type RichIconVariant = 'gem' | 'glass' | 'inline' | 'ribbon';
type RichIconSize = 'sm' | 'md' | 'lg' | 'xl';
type RichIconMotion = 'none' | 'float' | 'pulse' | 'spin';

interface RichIconProps {
  name: AppIconName;
  variant?: RichIconVariant;
  size?: RichIconSize;
  accent?: string;
  accent2?: string;
  motion?: RichIconMotion;
  className?: string;
}

const MOTION_CLASS = {
  float: styles.motionFloat ?? '',
  pulse: styles.motionPulse ?? '',
  spin: styles.motionSpin ?? '',
} satisfies Record<Exclude<RichIconMotion, 'none'>, string>;

const DEFAULT_MOTION: Partial<Record<RichIconVariant, RichIconMotion>> = {
  gem: 'float',
  glass: 'pulse',
  inline: 'pulse',
};

const RichIcon = memo(function RichIcon({
  name,
  variant = 'gem',
  size = 'md',
  accent,
  accent2,
  motion,
  className,
}: RichIconProps) {
  const gradientId = useId().replace(/:/g, '');
  const Icon = ICON_REGISTRY[name];
  const resolvedMotion = motion ?? DEFAULT_MOTION[variant] ?? 'none';
  const motionClass = resolvedMotion !== 'none' ? MOTION_CLASS[resolvedMotion] : undefined;

  return (
    <span
      className={classNames(
        styles.wrap,
        styles[variant],
        styles[size],
        motionClass,
        className,
      )}
      style={{
        '--icon-accent': accent,
        '--icon-accent-2': accent2 ?? accent,
      } as CSSProperties}
      aria-hidden
    >
      <svg className={styles.defs} aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--icon-accent, var(--color-mint))" />
            <stop offset="52%" stopColor="white" />
            <stop offset="100%" stopColor="var(--icon-accent-2, var(--color-accent))" />
          </linearGradient>
        </defs>
      </svg>
      <Icon
        className={styles.icon}
        strokeWidth={variant === 'ribbon' ? 2.25 : 1.85}
        style={{ stroke: variant === 'ribbon' ? 'currentColor' : `url(#${gradientId})` }}
      />
    </span>
  );
});

export {
  RichIcon,
};

export type {
  RichIconProps,
  RichIconVariant,
  RichIconSize,
  RichIconMotion,
};
