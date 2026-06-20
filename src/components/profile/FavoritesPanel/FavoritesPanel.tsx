import { useEffect, useState } from 'react';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { fetchFavoriteListings } from '@/services/favoritesApi';
import type { Listing } from '@/types/listing';
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
    <section className={styles.panel} aria-labelledby="favorites-title">
      <h2 id="favorites-title" className={styles.title}>Избранное</h2>
      <p className={styles.desc}>Сохранённые услуги, чтобы не потерять</p>

      {loading ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Пока ничего не добавлено. Нажмите ☆ на карточке услуги</p>
      ) : (
        <div className={styles.grid}>
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}

export {
  FavoritesPanel,
}
