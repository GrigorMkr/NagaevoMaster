import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { ABOUT_IMAGES } from '@/data/aboutImages';
import { APP_DESCRIPTION, APP_NAME, GEO } from '@/utils/constants';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import pageStyles from '@/styles/page.module.css';
import styles from './AboutPage.module.css';

const audience = [
  'Жители поселка и дачники',
  'Владельцы домов и земельных участков',
  'Строители, фермеры и малый бизнес',
  'Мужчины и женщины от 18 до 65 лет',
];

const moderationRules = [
  'Запрещены оскорбления, спам и реклама без согласования',
  'Объявления должны относиться к услугам в радиусе 50 км от Нагаево',
  'Контакты и цены указываются честно и актуально',
  'Модератор может скрыть объявление при жалобах жителей',
];

const platformRules = [
  'Регистрация доступна жителям и мастерам из окрестностей',
  'Один аккаунт — один исполнитель или компания',
  'Отзывы публикуются только после проверки модератором',
  'Администрация оставляет за собой право блокировать нарушителей',
];

function AboutPage() {
  return (
    <>
      <PageMeta title="О проекте" description={APP_DESCRIPTION} />

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader
            badge="О нас"
            title={`О проекте ${APP_NAME}`}
            subtitle={APP_DESCRIPTION}
          />

          <Reveal delay={80}>
            <div className={`${styles.grid} motion-stagger`}>
            <article className={styles.card} tabIndex={0}>
              <div className={styles.cardMedia}>
                <img
                  className={styles.cardImage}
                  src={ABOUT_IMAGES.audience}
                  alt="Целевая аудитория"
                  loading="lazy"
                />
                <div className={styles.cardPanel}>
                  <h2>Целевая аудитория</h2>
                  <div className={styles.cardContent}>
                    <ul>
                      {audience.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            <article className={styles.card} tabIndex={0}>
              <div className={styles.cardMedia}>
                <img
                  className={styles.cardImage}
                  src={ABOUT_IMAGES.geography}
                  alt="География"
                  loading="lazy"
                />
                <div className={styles.cardPanel}>
                  <h2>География</h2>
                  <div className={styles.cardContent}>
                    <p>
                      Поселок <strong>{GEO.settlement}</strong> и окрестности в радиусе{' '}
                      <strong>{GEO.radiusKm} км</strong>. Мы объединяем местные услуги в одном
                      удобном каталоге.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className={styles.card} tabIndex={0}>
              <div className={styles.cardMedia}>
                <img
                  className={styles.cardImage}
                  src={ABOUT_IMAGES.mission}
                  alt="Наша миссия"
                  loading="lazy"
                />
                <div className={styles.cardPanel}>
                  <h2>Наша миссия</h2>
                  <div className={styles.cardContent}>
                    <p>
                      Сделать поиск специалистов и услуг в Нагаево простым, быстрым и надёжным —
                      для жителей и для тех, кто предлагает свои услуги.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className={styles.card} tabIndex={0}>
              <div className={styles.cardMedia}>
                <img
                  className={styles.cardImage}
                  src={ABOUT_IMAGES.rules}
                  alt="Правила платформы"
                  loading="lazy"
                />
                <div className={styles.cardPanel}>
                  <h2>Правила платформы</h2>
                  <div className={styles.cardContent}>
                    <ul>
                      {platformRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            <article className={styles.card} tabIndex={0}>
              <div className={styles.cardMedia}>
                <img
                  className={styles.cardImage}
                  src={ABOUT_IMAGES.moderation}
                  alt="Модерация"
                  loading="lazy"
                />
                <div className={styles.cardPanel}>
                  <h2>Модерация</h2>
                  <div className={styles.cardContent}>
                    <ul>
                      {moderationRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}

export {
  AboutPage,
};
