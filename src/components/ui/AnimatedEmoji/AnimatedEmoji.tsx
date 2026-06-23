import { memo } from 'react';
import classNames from 'classnames';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import { emojiSvgFallbackUrls, emojiSvgLocalUrl } from '@/utils/emojiAsset';
import styles from './AnimatedEmoji.module.css';

type AnimatedEmojiSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type EmojiAnimation = 'bob' | 'bounce' | 'pulse' | 'wiggle' | 'shake' | 'wave' | 'none';

interface AnimatedEmojiProps {
  emoji: string;
  animation?: EmojiAnimation;
  size?: AnimatedEmojiSize;
  className?: string;
  label?: string;
}

const ANIM_CLASS: Record<Exclude<EmojiAnimation, 'none'>, string> = {
  bob: styles.animBob ?? '',
  bounce: styles.animBounce ?? '',
  pulse: styles.animPulse ?? '',
  wiggle: styles.animWiggle ?? '',
  shake: styles.animShake ?? '',
  wave: styles.animWave ?? '',
};

const AnimatedEmoji = memo(function AnimatedEmoji({
  emoji,
  animation = 'bob',
  size = 'md',
  className,
  label,
}: AnimatedEmojiProps) {
  const { lowPower } = usePerformanceProfile();
  const resolvedAnimation = lowPower ? 'none' : animation;
  const animClass = resolvedAnimation !== 'none' ? ANIM_CLASS[resolvedAnimation] : undefined;

  return (
    <span
      className={classNames(styles.wrap, styles[size], animClass, className)}
      role="img"
      aria-label={label ?? emoji}
    >
      <img
        className={styles.img}
        src={emojiSvgLocalUrl(emoji)}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={(event) => {
          const image = event.currentTarget;
          const fallbacks = emojiSvgFallbackUrls(emoji);
          const currentIndex = fallbacks.indexOf(image.src);
          const next = fallbacks[currentIndex + 1];
          if (next) {
            image.src = next;
          }
        }}
      />
    </span>
  );
});

export {
  AnimatedEmoji,
};

export type {
  AnimatedEmojiSize,
  EmojiAnimation,
  AnimatedEmojiProps,
};
