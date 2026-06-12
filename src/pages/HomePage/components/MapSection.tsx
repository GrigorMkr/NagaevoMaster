import { lazy, memo, Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { GEO } from '@/constants';
import { MOCK_LISTINGS } from '@/data/mockListings';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';
const ProvidersMap = lazy(() => import('@/components/map/ProvidersMap/ProvidersMap').then((m) => ({
    default: m.ProvidersMap,
})));
const MapSection = memo(function MapSection() {
    return (<div className={styles.contentBlock}>
      <SectionHead badge="Карта" title="Мастера на карте" description={`Исполнители в радиусе ${GEO.radiusKm} км от ${GEO.settlement}`}/>
      <Suspense fallback={<Skeleton variant="map"/>}>
        <ProvidersMap listings={MOCK_LISTINGS}/>
      </Suspense>
    </div>);
});

export {
  MapSection,
}
