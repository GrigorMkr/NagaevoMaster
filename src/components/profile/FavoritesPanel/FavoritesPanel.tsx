import { useEffect, useState } from 'react';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { ProfileExpandableSection } from '@/components/profile/ProfileExpandableSection/ProfileExpandableSection';
import { fetchFavoriteListings } from '@/services/favoritesApi';
import type { Listing } from '@/types/listing';
import tileGrid from '@/styles/tileGrid.module.css';
import styles from './FavoritesPanel.module.css';

function FavoritesPanel() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavoriteListings()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProfileExpandableSection title="Избранное" icon="heart" iconAccent="#f08a7e" count={items.length} loading={loading}>
      {items.length === 0 ? (
        <p className={styles.empty}>Пока пусто — добавьте услугу в избранное на карточке</p>
      ) : (
        <div className={tileGrid.grid}>
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </ProfileExpandableSection>
  );
}

export {
  FavoritesPanel,
};
