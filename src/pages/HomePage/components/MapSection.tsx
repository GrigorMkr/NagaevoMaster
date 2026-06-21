import { lazy, memo, Suspense, useEffect, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { AuthRequiredPanel } from '@/components/auth/AuthRequiredPanel/AuthRequiredPanel'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { GEO } from '@/constants'
import { selectIsAuthenticated } from '@/features/user/userSelectors'
import { SortBy } from '@/enums/sort'
import { fetchListings } from '@/services/listingsApi'
import type { Listing } from '@/types/listing'
import { SectionHead } from './SectionHead'
import styles from '../HomePage.module.css'

const ProvidersMap = lazy(() =>
  import('@/components/map/ProvidersMap/ProvidersMap').then((module) => ({
    default: module.ProvidersMap,
  })),
)

const MapSection = memo(function MapSection() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const accountLocation = useAppSelector((state) => state.user.accountLocation)
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setListings([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    fetchListings({
      sortBy: accountLocation ? SortBy.Distance : SortBy.Popular,
      originLat: accountLocation?.lat ?? null,
      originLng: accountLocation?.lng ?? null,
      distance: accountLocation ? GEO.radiusKm : null,
    })
      .then((response) => {
        if (!cancelled) {
          setListings(response.items)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setListings([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, accountLocation])

  const mapDescription = accountLocation
    ? `Ближайшие мастера в радиусе ${GEO.radiusKm} км от вас`
    : `Исполнители в радиусе ${GEO.radiusKm} км от ${GEO.settlement}`

  return (
    <div className={styles.contentBlock}>
      <SectionHead
        badge="Карта"
        title="Мастера на карте"
        description={mapDescription}
      />

      {isAuthenticated ? (
        <>
          {isLoading && <p className="textMuted">Загрузка карты…</p>}
          <Suspense fallback={<Skeleton variant="map" />}>
            <ProvidersMap
              listings={listings}
              userLocation={accountLocation}
              fitToListings
            />
          </Suspense>
        </>
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
