import { lazy, Suspense } from 'react';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import { useNews } from '@/hooks/useNews';
import { APP_DESCRIPTION } from '@/constants';
import { HeroSection } from './components/HeroSection';
import { NewsSection } from './components/NewsSection';
import { BoardPortalSection } from './components/BoardPortalSection';
import styles from './HomePage.module.css';

const PopularServicesSection = lazy(async () => {
  const module = await import('./components/PopularServicesSection');
  return { default: module.PopularServicesSection };
});

const MapSection = lazy(async () => {
  const module = await import('./components/MapSection');
  return { default: module.MapSection };
});

const CategoriesSection = lazy(async () => {
  const module = await import('./components/CategoriesSection');
  return { default: module.CategoriesSection };
});

const ForumSection = lazy(async () => {
  const module = await import('./components/ForumSection');
  return { default: module.ForumSection };
});

const ReviewsSection = lazy(async () => {
  const module = await import('./components/ReviewsSection');
  return { default: module.ReviewsSection };
});

const StepsSection = lazy(async () => {
  const module = await import('./components/StepsSection');
  return { default: module.StepsSection };
});

const FeaturesSection = lazy(async () => {
  const module = await import('./components/FeaturesSection');
  return { default: module.FeaturesSection };
});

const CtaSection = lazy(async () => {
  const module = await import('./components/CtaSection');
  return { default: module.CtaSection };
});

function HomePage() {
  const { local, external, loading: newsLoading } = useNews();

  return (
    <div className={styles.homeShell}>
      <PageMeta
        description={APP_DESCRIPTION}
        canonical="/"
        robots="index, follow, max-image-preview:large"
        keywords="Нагаево, мастера, услуги, объявления, форум, специалисты, посёлок Нагаево, Башкортостан"
      />
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
            />
          </Reveal>
          <Reveal delay={80}>
            <NewsSection
              badge="Регион"
              title="Из СМИ"
              items={external}
              loading={newsLoading}
              moreLinkLabel="Ещё →"
            />
          </Reveal>
          <Reveal delay={120}>
            <Suspense fallback={null}>
              <PopularServicesSection />
            </Suspense>
          </Reveal>
          <Reveal delay={100}>
            <BoardPortalSection />
          </Reveal>
          <Reveal delay={100}>
            <Suspense fallback={null}>
              <MapSection />
            </Suspense>
          </Reveal>
          <Reveal delay={80}>
            <Suspense fallback={null}>
              <CategoriesSection />
            </Suspense>
          </Reveal>
          <Reveal delay={100}>
            <Suspense fallback={null}>
              <ForumSection />
            </Suspense>
          </Reveal>
          <Reveal delay={80}>
            <Suspense fallback={null}>
              <ReviewsSection />
            </Suspense>
          </Reveal>
          <Reveal delay={100}>
            <Suspense fallback={null}>
              <StepsSection />
            </Suspense>
          </Reveal>
          <Reveal delay={80}>
            <Suspense fallback={null}>
              <FeaturesSection />
            </Suspense>
          </Reveal>
          <Reveal delay={120}>
            <Suspense fallback={null}>
              <CtaSection />
            </Suspense>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export {
  HomePage,
}
