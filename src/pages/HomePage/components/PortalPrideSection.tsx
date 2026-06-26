import { memo } from 'react';
import { RichIcon } from '@/components/ui/RichIcon';
import styles from './PortalPrideSection.module.css';

const PortalPrideSection = memo(function PortalPrideSection() {
  return (
    <section className={styles.section} aria-labelledby="portal-pride-title">
      <div className={styles.orbA} aria-hidden />
      <div className={styles.orbB} aria-hidden />

      <div className="container">
        <header className={styles.head}>
          <div className={styles.eyebrow}>
            <span className={styles.liveDot} aria-hidden />
            <span>Портал Нагаево</span>
            <span className={styles.freePill}>100% бесплатно</span>
          </div>

          <h2 id="portal-pride-title" className={styles.title}>
            <span className={styles.titleLine}>Нагаево Мастер</span>
            <span className={styles.titleAccent}>больше, чем поиск специалистов</span>
          </h2>

          <p className={styles.lead}>
            Наш общий цифровой дом — ищут мастеров, общаются, продают и покупают,
            помогают соседям и строят посёлок вместе. Открыто, понятно и честно.
          </p>

          <div className={styles.freeRibbon}>
            <RichIcon name="sparkles" variant="gem" size="sm" accent="#e8b84a" motion="spin" className={styles.freeRibbonIcon} />
            <p>
              <strong>Всё бесплатно</strong>
              {' '}
              — без подписок и скрытых платежей.
              Заходите и пользуетесь.
            </p>
          </div>
        </header>

        <p className={styles.closing}>
          <span className={styles.closingGlow} aria-hidden />
          Мы гордимся: для Нагаево — всё необходимое в одном портале, для своих,
          {' '}
          <em>навсегда бесплатно</em>
          .
        </p>
      </div>
    </section>
  );
});

export {
  PortalPrideSection,
};
