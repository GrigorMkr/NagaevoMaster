import { memo } from 'react';
import { Link } from 'react-router-dom';
import { NewsCard } from '@/components/news/NewsCard/NewsCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { NEWS_PREVIEW_COUNT, ROUTES } from '@/constants';
import type { NewsItem } from '@/types/news';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';
interface NewsSectionProps {
    badge: string;
    title: string;
    description: string;
    items: NewsItem[];
    loading: boolean;
    moreLinkLabel: string;
}
const NewsSection = memo(function NewsSection({ badge, title, description, items, loading, moreLinkLabel, }: NewsSectionProps) {
    return (<div className={styles.contentBlock}>
      <SectionHead badge={badge} title={title} description={description}/>
      {loading ? (<div className={styles.newsGrid}>
          {Array.from({ length: NEWS_PREVIEW_COUNT }).map((_, i) => (<Skeleton key={i} variant="card"/>))}
        </div>) : (<div className={styles.newsGrid}>
          {items.slice(0, NEWS_PREVIEW_COUNT).map((item) => (<NewsCard key={item.id} item={item} variant="compact"/>))}
        </div>)}
      <Link to={ROUTES.NEWS} className={styles.moreLink}>
        {moreLinkLabel}
      </Link>
    </div>);
});

export {
  NewsSection,
}
