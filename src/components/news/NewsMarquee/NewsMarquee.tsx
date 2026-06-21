import { memo, useMemo } from 'react';
import classNames from 'classnames';
import { NewsCard } from '@/components/news/NewsCard/NewsCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import type { NewsItem } from '@/types/news';
import styles from './NewsMarquee.module.css';

type MarqueeDirection = 'left' | 'right';
type MarqueeSize = 'home' | 'page';

interface NewsMarqueeProps {
  items: NewsItem[];
  direction?: MarqueeDirection;
  size?: MarqueeSize;
  loading?: boolean;
  skeletonCount?: number;
}

function buildLoopItems(items: NewsItem[], minCount = 6): NewsItem[] {
  if (items.length === 0) return [];
  let loop = [...items];
  while (loop.length < minCount) {
    loop = [...loop, ...items];
  }
  return [...loop, ...loop];
}

const NewsMarquee = memo(function NewsMarquee({
  items,
  direction = 'left',
  size = 'home',
  loading = false,
  skeletonCount = 4,
}: NewsMarqueeProps) {
  const loopItems = useMemo(() => buildLoopItems(items), [items]);
  const showcaseSize = size === 'page' ? 'showcaseLarge' : 'showcase';

  if (loading) {
    return (
      <div className={classNames(styles.shell, size === 'page' && styles.sizePage)}>
        <div className={styles.skeletonRow}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Skeleton key={index} variant="card" className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  if (loopItems.length === 0) {
    return null;
  }

  return (
    <div className={classNames(styles.shell, size === 'page' && styles.sizePage)}>
      <div
        className={classNames(styles.glow, direction === 'right' && styles.glowRight)}
        aria-hidden
      />
      <div className={styles.viewport}>
        <div
          className={classNames(styles.track, direction === 'right' && styles.trackRight)}
          aria-label="Лента новостей"
        >
          {loopItems.map((item, index) => (
            <NewsCard
              key={`${item.id}-${index}`}
              item={item}
              variant={showcaseSize}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export {
  NewsMarquee,
};

export type {
  MarqueeDirection,
  MarqueeSize,
};
