import { memo, useEffect, useState } from 'react';
import { BoardListingCard } from '@/components/board/BoardListingCard/BoardListingCard';
import { HorizontalCarousel } from '@/components/ui/HorizontalCarousel/HorizontalCarousel';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import { SortBy } from '@/enums/sort';
import { fetchListings } from '@/services/listingsApi';
import type { Listing, ListingKind } from '@/types/listing';
import styles from './BoardNewListingsStrip.module.css';

const BOARD_KINDS: ListingKind[] = ['sale', 'vacancy', 'lost'];
const POLL_INTERVAL_MS = 45_000;
const POLL_INTERVAL_LOW_POWER_MS = 90_000;
const SKELETON_COUNT = 4;

function isPublishedBoardListing(listing: Listing): boolean {
  return listing.status !== 'pending' && listing.status !== 'rejected';
}

function sortBoardListings(items: Listing[]): Listing[] {
  return [...items].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

async function fetchNewBoardListings(): Promise<Listing[]> {
  const responses = await Promise.all(
    BOARD_KINDS.map((kind) => fetchListings({ kind, sortBy: SortBy.Newest })),
  );

  const unique = new Map<string, Listing>();
  for (const listing of responses.flatMap((response) => response.items)) {
    if (isPublishedBoardListing(listing)) {
      unique.set(listing.id, listing);
    }
  }

  return sortBoardListings([...unique.values()]);
}

const BoardNewListingsStrip = memo(function BoardNewListingsStrip() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { lowPower } = usePerformanceProfile();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const items = await fetchNewBoardListings();
        if (!cancelled) {
          setListings(items);
        }
      } catch {
        if (!cancelled) {
          setListings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    const pollMs = lowPower ? POLL_INTERVAL_LOW_POWER_MS : POLL_INTERVAL_MS;
    const timer = window.setInterval(() => {
      void load();
    }, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [lowPower]);

  return (
    <section className={styles.strip} aria-label="Новые объявления на доске">
      <div className={styles.head}>
        <span className={styles.badge}>Свежее</span>
        <h2 className={styles.title}>Новые объявления</h2>
      </div>

      {loading && (
        <div className={styles.skeletonRow}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Skeleton key={index} variant="card" className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {!loading && listings.length === 0 && (
        <p className={styles.empty}>Пока нет новых объявлений — будьте первым.</p>
      )}

      {!loading && listings.length > 0 && (
        <HorizontalCarousel
          ariaLabel="Новые объявления на доске"
          className={styles.carousel}
          slideClassName={styles.slide}
          autoScroll={listings.length > 1}
          loop={false}
          bleed={false}
          fadeEdges={false}
          showArrows={listings.length > 1}
        >
          {listings.map((listing) => (
            <BoardListingCard key={listing.id} listing={listing} />
          ))}
        </HorizontalCarousel>
      )}
    </section>
  );
});

export {
  BoardNewListingsStrip,
};
