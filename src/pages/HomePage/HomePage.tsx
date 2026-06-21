import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import { useNews } from '@/hooks/useNews';
import { APP_DESCRIPTION } from '@/constants';
import { CategoriesSection } from './components/CategoriesSection';
import { CtaSection } from './components/CtaSection';
import { FeaturesSection } from './components/FeaturesSection';
import { ForumSection } from './components/ForumSection';
import { HeroSection } from './components/HeroSection';
import { MapSection } from './components/MapSection';
import { NewsSection } from './components/NewsSection';
import { PopularServicesSection } from './components/PopularServicesSection';
import { ReviewsSection } from './components/ReviewsSection';
import { StepsSection } from './components/StepsSection';
import styles from './HomePage.module.css';

function HomePage() {
  const { local, external, loading: newsLoading } = useNews();

  return (
    <div className={styles.homeShell}>
      <PageMeta description={APP_DESCRIPTION} canonical="/" />
      <HeroSection />
      <section className={styles.mainContent}>
        <div className="container">
          <Reveal>
            <NewsSection
              badge="Посёлок"
              title="Новости"
              items={local}
              loading={newsLoading}
              moreLinkLabel="Все новости →"
              direction="left"
            />
          </Reveal>
          <Reveal delay={80}>
            <NewsSection
              badge="Регион"
              title="Из СМИ"
              items={external}
              loading={newsLoading}
              moreLinkLabel="Ещё →"
              direction="right"
            />
          </Reveal>
          <Reveal delay={120}>
            <PopularServicesSection />
          </Reveal>
          <Reveal delay={100}>
            <MapSection />
          </Reveal>
          <Reveal delay={80}>
            <CategoriesSection />
          </Reveal>
          <Reveal delay={100}>
            <ForumSection />
          </Reveal>
          <Reveal delay={80}>
            <ReviewsSection />
          </Reveal>
          <Reveal delay={100}>
            <StepsSection />
          </Reveal>
          <Reveal delay={80}>
            <FeaturesSection />
          </Reveal>
          <Reveal delay={120}>
            <CtaSection />
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export {
  HomePage,
}
