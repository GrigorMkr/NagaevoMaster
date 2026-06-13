import { lazy, memo, Suspense } from 'react'
import { useAppSelector } from '@/app/hooks'
import { AuthRequiredPanel } from '@/components/auth/AuthRequiredPanel/AuthRequiredPanel'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { selectIsAuthenticated } from '@/features/user/userSelectors'
import { GEO } from '@/constants'
import { MOCK_LISTINGS } from '@/data/mockListings'
import { SectionHead } from './SectionHead'
import styles from '../HomePage.module.css'

const ProvidersMap = lazy(() =>
  import('@/components/map/ProvidersMap/ProvidersMap').then((module) => ({
    default: module.ProvidersMap,
  })),
)

const MapSection = memo(function MapSection() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  return (
    <div className={styles.contentBlock}>
      <SectionHead
        badge="Карта"
        title="Мастера на карте"
        description={`Исполнители в радиусе ${GEO.radiusKm} км от ${GEO.settlement}`}
      />

      {isAuthenticated ? (
        <Suspense fallback={<Skeleton variant="map" />}>
          <ProvidersMap listings={MOCK_LISTINGS} />
        </Suspense>
      ) : (
        <AuthRequiredPanel
          title="Карта доступна после входа"
          description="Войдите в аккаунт, чтобы видеть услуги мастеров на карте посёлка."
        />
      )}
    </div>
  )
})

export {
  MapSection,
}
