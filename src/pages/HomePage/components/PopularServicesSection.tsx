import { memo, useEffect, useState } from 'react';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { HorizontalCarousel } from '@/components/ui/HorizontalCarousel/HorizontalCarousel';
import { SortBy } from '@/enums/sort';
import { fetchListings } from '@/services/listingsApi';
import type { Listing } from '@/types/listing';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';

const POPULAR_LIMIT = 24;

const PopularServicesSection = memo(function PopularServicesSection() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchListings({ sortBy: SortBy.Newest })
      .then((response) => {
        if (!cancelled) {
          setListings(response.items.slice(0, POPULAR_LIMIT));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setListings([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.contentBlock}>
      <SectionHead badge="Каталог" title="Новые услуги" />
      {loading ? (
        <p className="textMuted">Загрузка…</p>
      ) : listings.length === 0 ? (
        <p className="textMuted">Скоро здесь появятся новые объявления</p>
      ) : (
        <HorizontalCarousel
          ariaLabel="Новые услуги"
          slideClassName={styles.listingCarouselSlide}
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              variant="tile"
              showFavorite={false}
              onModerated={(listingId) => {
                setListings((current) => current.filter((item) => item.id !== listingId));
              }}
            />
          ))}
        </HorizontalCarousel>
      )}
    </div>
  );
});

export {
  PopularServicesSection,
};
