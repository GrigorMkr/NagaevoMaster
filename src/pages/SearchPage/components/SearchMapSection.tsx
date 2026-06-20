import { lazy, memo, Suspense } from 'react'
import { useAppSelector } from '@/app/hooks'
import { AuthRequiredPanel } from '@/components/auth/AuthRequiredPanel/AuthRequiredPanel'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { selectIsAuthenticated } from '@/features/user/userSelectors'
import type { Listing } from '@/types/listing'
import type { AccountLocation } from '@/types/location'
import styles from '../SearchPage.module.css'

const ProvidersMap = lazy(() =>
  import('@/components/map/ProvidersMap/ProvidersMap').then((module) => ({
    default: module.ProvidersMap,
  })),
)

interface SearchMapSectionProps {
  listings: Listing[]
  userLocation: AccountLocation | null
  query?: string
}

const SearchMapSection = memo(function SearchMapSection({
  listings,
  userLocation,
  query,
}: SearchMapSectionProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (listings.length === 0) {
    return null
  }

  return (
    <section className={styles.mapSection} aria-label="Ближайшие услуги на карте">
      <h2 className={styles.mapTitle}>Ближайшие услуги на карте</h2>
      <p className={styles.mapHint}>
        {userLocation
          ? query
            ? `На карте — результаты по запросу «${query}» рядом с вами`
            : 'Показаны услуги рядом с вашим местоположением'
          : 'Укажите местоположение в профиле или нажмите «Да, определить» после входа'}
      </p>

      {isAuthenticated ? (
        <Suspense fallback={<Skeleton variant="map" />}>
          <ProvidersMap
            listings={listings}
            showFilters={false}
            fitToListings
            userLocation={userLocation}
          />
        </Suspense>
      ) : (
        <AuthRequiredPanel
          title="Войдите, чтобы открыть карту"
          description="После авторизации на карте появятся найденные услуги рядом с вами."
        />
      )}
    </section>
  )
})

export {
  SearchMapSection,
}
