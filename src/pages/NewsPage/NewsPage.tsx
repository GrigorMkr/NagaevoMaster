import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { SKELETON_COUNT_NEWS } from '@/constants';
import { NewsMarquee } from '@/components/news/NewsMarquee/NewsMarquee';
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
              <NewsMarquee
                items={local}
                direction="left"
                size="page"
                loading={loading}
                skeletonCount={SKELETON_COUNT_NEWS}
              />
            </section>
          </Reveal>

          <Reveal delay={120}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Регион · Из СМИ</h2>
              <NewsMarquee
                items={external}
                direction="right"
                size="page"
                loading={loading}
                skeletonCount={SKELETON_COUNT_NEWS}
              />
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
