import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { Button } from '@/components/ui/Button/Button';
import { fetchPendingListings, moderateListing } from '@/services/listingsApi';
import type { Listing } from '@/types/listing';
import styles from './ModerationPanel.module.css';

function ModerationPanel() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchPendingListings());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось загрузить очередь');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleModerate = async (id: string, status: 'published' | 'rejected') => {
    setBusyId(id);
    try {
      await moderateListing(id, status);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success(status === 'published' ? 'Объявление опубликовано' : 'Объявление отклонено');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка модерации');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="moderation-title">
      <h2 id="moderation-title" className={styles.title}>Модерация объявлений</h2>
      <p className={styles.desc}>Новые объявления ждут проверки перед публикацией в каталоге.</p>

      {loading ? (
        <p className={styles.status}>Загрузка…</p>
      ) : items.length === 0 ? (
        <p className={styles.status}>Очередь пуста — новых объявлений нет.</p>
      ) : (
        <div className={styles.queue}>
          {items.map((listing) => (
            <article key={listing.id} className={styles.item}>
              <ListingCard listing={listing} preview />
              <div className={styles.actions}>
                <Button
                  size="sm"
                  loading={busyId === listing.id}
                  onClick={() => void handleModerate(listing.id, 'published')}
                >
                  Одобрить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={busyId === listing.id}
                  onClick={() => void handleModerate(listing.id, 'rejected')}
                >
                  Отклонить
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export {
  ModerationPanel,
}
