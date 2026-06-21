import { memo } from 'react';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { SKELETON_COUNT_DEFAULT } from '@/constants';
import type { Listing } from '@/types/listing';
import tileGrid from '@/styles/tileGrid.module.css';
import pageStyles from '@/styles/page.module.css';
interface ListingResultsProps {
    items: Listing[];
    isLoading: boolean;
}
const ListingResults = memo(function ListingResults({ items, isLoading, }: ListingResultsProps) {
    if (isLoading) {
        return (<div className={tileGrid.grid}>
        {Array.from({ length: SKELETON_COUNT_DEFAULT }, (_, i) => (<Skeleton key={i} variant="card"/>))}
      </div>);
    }
    if (items.length === 0) {
        return (<div className={pageStyles.empty}>
        <p className={pageStyles.emptyTitle}>Ничего не найдено</p>
        <p className={pageStyles.emptyHint}>Попробуйте изменить запрос или фильтры</p>
      </div>);
    }
    return (<div className={tileGrid.grid}>
      {items.map((listing) => (<ListingCard key={listing.id} listing={listing}/>))}
    </div>);
});

export {
  ListingResults,
}
