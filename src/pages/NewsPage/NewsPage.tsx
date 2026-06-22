import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { SKELETON_COUNT_NEWS } from '@/constants';
import { HorizontalCarousel } from '@/components/ui/HorizontalCarousel/HorizontalCarousel';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { NewsCard } from '@/components/news/NewsCard/NewsCard';
import { useNews } from '@/hooks/useNews';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import pageStyles from '@/styles/page.module.css';
import styles from './NewsPage.module.css';

function NewsPage() {
  const { local, external, loading, error } = useNews();

  return (
    <>
      <PageMeta title="Новости" canonical="/news" />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Новости" title="Нагаево" />

          {error && <p className={styles.error}>{error}</p>}

          <Reveal delay={80}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Посёлок</h2>
              {loading ? (
                <div className={styles.skeletonRow}>
                  {Array.from({ length: SKELETON_COUNT_NEWS }).map((_, index) => (
                    <Skeleton key={index} variant="card" className={styles.skeletonCard} />
                  ))}
                </div>
              ) : (
                <HorizontalCarousel
                  ariaLabel="Новости посёлка"
                  slideClassName={styles.newsSlide}
                >
                  {local.map((item) => (
                    <NewsCard key={item.id} item={item} variant="showcaseCompact" />
                  ))}
                </HorizontalCarousel>
              )}
            </section>
          </Reveal>

          <Reveal delay={120}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Регион · Из СМИ</h2>
              {loading ? (
                <div className={styles.skeletonRow}>
                  {Array.from({ length: SKELETON_COUNT_NEWS }).map((_, index) => (
                    <Skeleton key={index} variant="card" className={styles.skeletonCard} />
                  ))}
                </div>
              ) : (
                <HorizontalCarousel
                  ariaLabel="Новости региона"
                  slideClassName={styles.newsSlide}
                >
                  {external.map((item) => (
                    <NewsCard key={item.id} item={item} variant="showcaseCompact" />
                  ))}
                </HorizontalCarousel>
              )}
            </section>
          </Reveal>
        </div>
      </div>
    </>
  );
}

export {
  NewsPage,
};
