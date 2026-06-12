import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { SKELETON_COUNT_NEWS } from '@/constants';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { NewsCard } from '@/components/news/NewsCard/NewsCard';
import { useNews } from '@/hooks/useNews';
import pageStyles from '@/styles/page.module.css';
import styles from './NewsPage.module.css';
function NewsPage() {
    const { local, external, loading, error } = useNews();
    return (<>
      <PageMeta title="Новости" description="Новости поселка Нагаево и региона — события, культура, инфраструктура и жизнь микрорайона." canonical="/news" keywords="новости Нагаево, Башкортостан, Уфа, события поселка"/>

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Актуально" title="Новости Нагаево" subtitle="События микрорайона и материалы из региональных СМИ — с фотографиями и ссылками на источники"/>

          {error && <p className={styles.error}>{error}</p>}

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Жизнь поселка</h2>
              <p className={styles.sectionDesc}>
                Новости с сайта Нагаевского дома культуры
              </p>
            </div>

            {loading ? (<div className={styles.grid}>
                {Array.from({ length: SKELETON_COUNT_NEWS }).map((_, i) => (<Skeleton key={i} variant="card"/>))}
              </div>) : (<div className={styles.grid}>
                {local.map((item) => (<NewsCard key={item.id} item={item}/>))}
              </div>)}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Новости из интернета</h2>
              <p className={styles.sectionDesc}>
                Региональные материалы о Нагаево и Башкортостане — Башинформ и другие источники
              </p>
            </div>

            {loading ? (<div className={styles.grid}>
                {Array.from({ length: SKELETON_COUNT_NEWS }).map((_, i) => (<Skeleton key={`ext-${i}`} variant="card"/>))}
              </div>) : (<div className={styles.grid}>
                {external.map((item) => (<NewsCard key={item.id} item={item}/>))}
              </div>)}
          </section>

          <p className={styles.hint}>
            Источники:{' '}
            <a href="https://nagaevodk.ru/category/news/" target="_blank" rel="noopener noreferrer">
              ДК с. Нагаево
            </a>
            {' · '}
            <a href="https://www.bashinform.ru/" target="_blank" rel="noopener noreferrer">
              Башинформ
            </a>
          </p>
        </div>
      </div>
    </>);
}

export {
  NewsPage,
}
