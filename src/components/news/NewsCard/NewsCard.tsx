import { memo, useMemo, type SyntheticEvent } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { NEWS_CATEGORY_LABELS } from '@/enums';
import { NEWS_IMAGE_FALLBACK } from '@/data/realNews';
import type { NewsItem } from '@/types/news';
import styles from './NewsCard.module.css';

interface NewsCardProps {
  item: NewsItem;
  variant?: 'default' | 'compact' | 'tile' | 'showcase' | 'showcaseLarge' | 'showcaseCompact';
}

function handleNewsImageError(event: SyntheticEvent<HTMLImageElement>) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = NEWS_IMAGE_FALLBACK;
}

const NewsCard = memo(function NewsCard({ item, variant = 'default' }: NewsCardProps) {
  const dateLabel = useMemo(
    () => format(new Date(item.publishedAt), 'd MMM', { locale: ru }),
    [item.publishedAt],
  );
  const categoryLabel = NEWS_CATEGORY_LABELS[item.category];
  const imageSrc = item.imageUrl || NEWS_IMAGE_FALLBACK;

  if (variant === 'showcase' || variant === 'showcaseLarge' || variant === 'showcaseCompact') {
    const showcaseClass = variant === 'showcaseLarge'
      ? styles.cardShowcaseLarge
      : variant === 'showcaseCompact'
        ? styles.cardShowcaseCompact
        : styles.cardShowcase;

    return (
      <article className={showcaseClass}>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.showcaseLink}
        >
          <div className={styles.showcaseImageWrap}>
            <img
              src={imageSrc}
              alt=""
              className={styles.showcaseImage}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleNewsImageError}
            />
            <span className={styles.showcaseShine} aria-hidden />
            <span className={styles.badge}>{categoryLabel}</span>
          </div>
          <div className={styles.showcaseBody}>
            <p className={styles.meta}>
              {item.sourceName} · {dateLabel}
            </p>
            <h3 className={styles.showcaseTitle}>{item.title}</h3>
            <p className={styles.showcaseSummary}>{item.summary}</p>
            <span className={styles.readMore}>Читать →</span>
          </div>
        </a>
      </article>
    );
  }

  if (variant === 'tile') {
    return (
      <article className={styles.cardTile}>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.tileLink}
        >
          <div className={styles.thumbTile}>
            <img
              src={imageSrc}
              alt=""
              className={styles.thumbImage}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleNewsImageError}
            />
            <span className={styles.badgeTile}>{categoryLabel}</span>
          </div>
          <div className={styles.bodyTile}>
            <h3 className={styles.titleTile}>{item.title}</h3>
            <p className={styles.metaTile}>
              {item.sourceName} · {dateLabel}
            </p>
          </div>
        </a>
      </article>
    );
  }

  const cardClass = variant === 'compact' ? styles.cardCompact : styles.card;

  return (
    <article className={cardClass}>
      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.imageLink}>
        <img
          src={imageSrc}
          alt=""
          className={styles.image}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleNewsImageError}
        />
        <span className={styles.badge}>{categoryLabel}</span>
      </a>

      <div className={styles.body}>
        <p className={styles.meta}>
          {item.sourceName} · {dateLabel}
        </p>
        <h3 className={styles.title}>
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        </h3>
        {variant === 'default' && <p className={styles.summary}>{item.summary}</p>}
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.readMore}>
          Читать →
        </a>
      </div>
    </article>
  );
});

export {
  NewsCard,
};
