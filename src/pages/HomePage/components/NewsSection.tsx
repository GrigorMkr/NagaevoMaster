import { memo } from 'react';
import { Link } from 'react-router-dom';
import { HorizontalCarousel } from '@/components/ui/HorizontalCarousel/HorizontalCarousel';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { NewsCard } from '@/components/news/NewsCard/NewsCard';
import { ROUTES } from '@/constants';
import type { NewsItem } from '@/types/news';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';

interface NewsSectionProps {
  badge: string;
  title: string;
  description?: string;
  items: NewsItem[];
  loading: boolean;
  moreLinkLabel: string;
}

const NewsSection = memo(function NewsSection({
  badge,
  title,
  description,
  items,
  loading,
  moreLinkLabel,
}: NewsSectionProps) {
  return (
    <div className={styles.contentBlock}>
      <SectionHead badge={badge} title={title} description={description} />
      {loading ? (
        <div className={styles.newsSkeletonRow}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="card" className={styles.newsSkeletonCard} />
          ))}
        </div>
      ) : items.length === 0 ? null : (
        <HorizontalCarousel
          ariaLabel={`${title}: лента`}
          slideClassName={styles.newsCarouselSlide}
        >
          {items.map((item) => (
            <NewsCard key={item.id} item={item} variant="showcaseCompact" />
          ))}
        </HorizontalCarousel>
      )}
      <Link to={ROUTES.NEWS} className={styles.moreLink}>
        {moreLinkLabel}
      </Link>
    </div>
  );
});

export {
  NewsSection,
};
