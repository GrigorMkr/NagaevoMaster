import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { ABOUT_IMAGES } from '@/data/aboutImages';
import { COMMUNITY_RULES, BAN_POLICY_TEXT } from '@/constants/communityRules';
import { APP_DESCRIPTION, APP_NAME, GEO } from '@/utils/constants';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import { VkWallPostWidget } from '@/components/vk';
import { getVkCommunityUrl, useVkWidgets } from '@/constants/vkWidgets';
import { AboutCard } from './AboutCard';
import pageStyles from '@/styles/page.module.css';
import styles from './AboutPage.module.css';

const audience = [
  'Жители поселка и дачники',
  'Владельцы домов и земельных участков',
  'Строители, фермеры и малый бизнес',
  'Мужчины и женщины от 18 до 65 лет',
];

const moderationRules = [...COMMUNITY_RULES];

const platformRules = [
  'Регистрация доступна жителям и мастерам из окрестностей',
  'Один аккаунт — один исполнитель или компания',
  'Отзывы публикуются только от реальных клиентов услуги',
  BAN_POLICY_TEXT,
];

function AboutPage() {
  const vk = useVkWidgets();
  const communityUrl = vk.communityId ? getVkCommunityUrl(vk.communityId) : null;
  const showWallPost = vk.wallPostOwnerId !== null
    && vk.wallPostId !== null
    && vk.wallPostId > 0
    && Boolean(vk.wallPostHash);

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
            <AboutCard title="Целевая аудитория" image={ABOUT_IMAGES.audience} alt="Целевая аудитория">
              <ul>
                {audience.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AboutCard>

            <AboutCard title="География" image={ABOUT_IMAGES.geography} alt="География">
              <p>
                Поселок <strong>{GEO.settlement}</strong> и окрестности в радиусе{' '}
                <strong>{GEO.radiusKm} км</strong>. Мы объединяем местные услуги в одном
                удобном каталоге.
              </p>
            </AboutCard>

            <AboutCard title="Наша миссия" image={ABOUT_IMAGES.mission} alt="Наша миссия">
              <p>
                Сделать поиск специалистов и услуг в Нагаево простым, быстрым и надёжным —
                для жителей и для тех, кто предлагает свои услуги.
              </p>
            </AboutCard>

            <AboutCard title="Правила платформы" image={ABOUT_IMAGES.rules} alt="Правила платформы">
              <ul>
                {platformRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </AboutCard>

            <AboutCard title="Модерация" image={ABOUT_IMAGES.moderation} alt="Модерация">
              <ul>
                {moderationRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </AboutCard>
          </div>
          </Reveal>

          {(showWallPost || communityUrl) && (
            <Reveal delay={120}>
              <section className={styles.vkSection}>
                {communityUrl && (
                  <p className={styles.vkCommunityLead}>
                    Новости и обсуждения — в сообществе{' '}
                    <a href={communityUrl} target="_blank" rel="noopener noreferrer">
                      ВКонтакте
                    </a>
                    .
                  </p>
                )}
                {showWallPost && (
                  <VkWallPostWidget className={styles.vkWallPost} />
                )}
              </section>
            </Reveal>
          )}
        </div>
      </div>
    </>
  );
}

export {
  AboutPage,
};
