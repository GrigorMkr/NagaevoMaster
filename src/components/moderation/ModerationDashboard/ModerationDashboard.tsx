import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { ListingStatusBadge } from '@/components/listings/ListingStatusBadge/ListingStatusBadge';
import { Button } from '@/components/ui/Button/Button';
import {
  fetchModerationListings,
  fetchModerationReports,
  moderateListingStatus,
  updateReportStatus,
  type ModerationReport,
} from '@/services/moderationApi';
import type { Listing, ListingStatus } from '@/types/listing';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './ModerationDashboard.module.css';

type TabId = 'pending' | 'published' | 'rejected' | 'reports';

const TABS: { id: TabId; label: string }[] = [
  { id: 'pending', label: 'На модерации' },
  { id: 'published', label: 'Одобренные' },
  { id: 'rejected', label: 'Отклонённые' },
  { id: 'reports', label: 'Жалобы' },
];

function ModerationDashboard() {
  const [tab, setTab] = useState<TabId>('pending');
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      if (tab === 'reports') {
        setReports(await fetchModerationReports('all'));
        setListings([]);
      } else {
        setListings(await fetchModerationListings(tab as ListingStatus));
        setReports([]);
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Не удалось загрузить данные модерации');
      setApiError(message);
      setListings([]);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleModerate = async (id: string, status: 'published' | 'rejected') => {
    setBusyId(id);
    try {
      await moderateListingStatus(id, status);
      setListings((prev) => prev.filter((item) => item.id !== id));
      toast.success(status === 'published' ? 'Объявление опубликовано' : 'Объявление отклонено');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ошибка модерации'));
    } finally {
      setBusyId(null);
    }
  };

  const handleReport = async (id: string, status: 'resolved' | 'dismissed') => {
    setBusyId(id);
    try {
      await updateReportStatus(id, status);
      setReports((prev) => prev.filter((item) => item.id !== id));
      toast.success(status === 'resolved' ? 'Жалоба обработана' : 'Жалоба отклонена');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось обновить жалобу'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="moderation-title">
      <h2 id="moderation-title" className={styles.title}>Панель модератора</h2>
      <p className={styles.desc}>
        Очередь объявлений, история решений и жалобы пользователей
      </p>

      <div className={styles.tabs} role="tablist" aria-label="Разделы модерации">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? styles.tabActive : styles.tab}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {apiError && (
        <p className={styles.error}>
          {apiError}
          {apiError.includes('не найден') && (
            <> — обновите API на сервере: <code>bash scripts/vps/deploy-api.sh</code></>
          )}
        </p>
      )}

      {loading ? (
        <p className={styles.status}>Загрузка…</p>
      ) : tab === 'reports' ? (
        reports.length === 0 ? (
          <p className={styles.status}>Жалоб нет</p>
        ) : (
          <ul className={styles.reportList}>
            {reports.map((report) => (
              <li key={report.id} className={styles.reportItem}>
                <p className={styles.reportTitle}>{report.listingTitle}</p>
                <p className={styles.reportMeta}>
                  {report.reporterName} · {report.status} ·{' '}
                  {format(new Date(report.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                </p>
                {report.reason && <p className={styles.reportReason}>{report.reason}</p>}
                {report.status === 'pending' && (
                  <div className={styles.actions}>
                    <Button
                      size="sm"
                      loading={busyId === report.id}
                      onClick={() => void handleReport(report.id, 'resolved')}
                    >
                      Принять меры
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={busyId === report.id}
                      onClick={() => void handleReport(report.id, 'dismissed')}
                    >
                      Отклонить жалобу
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      ) : listings.length === 0 ? (
        <p className={styles.status}>
          {tab === 'pending' ? 'Очередь пуста — новых объявлений нет' : 'Записей нет'}
        </p>
      ) : (
        <div className={styles.queue}>
          {listings.map((listing) => (
            <article key={listing.id} className={styles.item}>
              <ListingStatusBadge status={listing.status} />
              <ListingCard listing={listing} preview showFavorite={false} />
              {tab === 'pending' && (
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
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export {
  ModerationDashboard,
}
