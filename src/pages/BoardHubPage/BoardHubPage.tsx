import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import { BoardPortalGrid } from '@/components/board/BoardPortalGrid/BoardPortalGrid';
import pageStyles from '@/styles/page.module.css';
import styles from './BoardHubPage.module.css';

function BoardHubPage() {
  return (
    <>
      <PageMeta
        title="Доска объявлений"
        description="Продажа, вакансии и потеряшки в Нагаево — барахолка, работа, нашли и потеряли."
        canonical="/board"
      />
      <div className={pageStyles.page}>
        <div className="container">
          <Reveal>
            <PageHeader
              badge="Объявления"
              title="Доска"
              subtitle="Три раздела для соседей: продать, найти работу или вернуть потерянное."
            />
          </Reveal>
          <Reveal delay={80}>
            <div className={styles.hero}>
              <BoardPortalGrid />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className={styles.note}>
              Услуги мастеров — в разделе
              {' '}
              <a href="/services">Услуги</a>
              . Все объявления проходят модерацию.
            </p>
          </Reveal>
        </div>
      </div>
    </>
  );
}

export {
  BoardHubPage,
};
