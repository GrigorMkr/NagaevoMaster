import { memo, useMemo } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { NEWS_CATEGORY_LABELS } from '@/enums'
import type { NewsItem } from '@/types/news'
import styles from './NewsCard.module.css'

interface NewsCardProps {
  item: NewsItem
  variant?: 'default' | 'compact'
}

export const NewsCard = memo(function NewsCard({ item, variant = 'default' }: NewsCardProps) {
  const dateLabel = useMemo(
    () => format(new Date(item.publishedAt), 'd MMMM yyyy', { locale: ru }),
    [item.publishedAt],
  )

  const categoryLabel = NEWS_CATEGORY_LABELS[item.category]

  return (
    <article className={variant === 'compact' ? styles.cardCompact : styles.card}>
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.imageLink}
      >
        <img
          src={item.imageUrl}
          alt=""
          className={styles.image}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
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
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.readMore}
        >
          Читать на {item.sourceName} →
        </a>
      </div>
    </article>
  )
})
