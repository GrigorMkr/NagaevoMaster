import { PageMeta } from '@/components/ui/PageMeta/PageMeta'
import { useNews } from '@/hooks/useNews'
import { APP_DESCRIPTION } from '@/constants'
import { CategoriesSection } from './components/CategoriesSection'
import { CtaSection } from './components/CtaSection'
import { FeaturesSection } from './components/FeaturesSection'
import { ForumSection } from './components/ForumSection'
import { HeroSection } from './components/HeroSection'
import { MapSection } from './components/MapSection'
import { NewsSection } from './components/NewsSection'
import { PopularServicesSection } from './components/PopularServicesSection'
import { ReviewsSection } from './components/ReviewsSection'
import { StepsSection } from './components/StepsSection'
import styles from './HomePage.module.css'

export function HomePage() {
  const { local, external, loading: newsLoading } = useNews()

  return (
    <>
      <PageMeta description={APP_DESCRIPTION} canonical="/" />
      <HeroSection />
      <section className={styles.mainContent}>
        <div className="container">
          <NewsSection
            badge="Новости"
            title="Новости Нагаево"
            description="События микрорайона — концерты, праздники и жизнь поселка"
            items={local}
            loading={newsLoading}
            moreLinkLabel="Все новости поселка →"
          />
          <NewsSection
            badge="Регион"
            title="Новости из интернета"
            description="Материалы о Нагаево и Башкортостане из региональных СМИ"
            items={external}
            loading={newsLoading}
            moreLinkLabel="Все региональные новости →"
          />
          <PopularServicesSection />
          <MapSection />
          <CategoriesSection />
          <ForumSection />
          <ReviewsSection />
          <StepsSection />
          <FeaturesSection />
          <CtaSection />
        </div>
      </section>
    </>
  )
}
