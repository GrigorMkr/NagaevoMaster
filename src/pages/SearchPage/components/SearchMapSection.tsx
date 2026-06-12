import { lazy, memo, Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import type { Listing } from '@/types/listing';
import type { AccountLocation } from '@/types/location';
import styles from '../SearchPage.module.css';
const ProvidersMap = lazy(() => import('@/components/map/ProvidersMap/ProvidersMap').then((module) => ({
    default: module.ProvidersMap,
})));
interface SearchMapSectionProps {
    listings: Listing[];
    userLocation: AccountLocation | null;
}
const SearchMapSection = memo(function SearchMapSection({ listings, userLocation, }: SearchMapSectionProps) {
    if (listings.length === 0) {
        return null;
    }
    return (<section className={styles.mapSection} aria-label="Ближайшие услуги на карте">
      <h2 className={styles.mapTitle}>Ближайшие услуги на карте</h2>
      <p className={styles.mapHint}>
        {userLocation
            ? 'Показаны результаты поиска относительно вашего местоположения'
            : 'Укажите местоположение в профиле для сортировки по расстоянию'}
      </p>
      <Suspense fallback={<Skeleton variant="map"/>}>
        <ProvidersMap listings={listings} showFilters={false} fitToListings userLocation={userLocation}/>
      </Suspense>
    </section>);
});

export {
  SearchMapSection,
}
