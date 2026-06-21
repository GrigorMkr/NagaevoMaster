import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectCanModerate } from '@/features/user/userSelectors';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CompactListingRow } from '@/components/listings/CompactListingRow/CompactListingRow';
import { ProfileExpandableSection } from '@/components/profile/ProfileExpandableSection/ProfileExpandableSection';
import { ModerationReviewModal, type ReviewMode } from '@/components/moderation/ModerationReviewModal/ModerationReviewModal';
import {
  fetchModerationListings,
  fetchModerationOnlineStats,
  fetchModerationReports,
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
  const canModerate = useAppSelector(selectCanModerate);
  const [tab, setTab] = useState<TabId>('pending');
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Awaited<ReturnType<typeof fetchModerationReports>>>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [guestsOnline, setGuestsOnline] = useState(0);
  const [usersOnline, setUsersOnline] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode | null>(null);

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

  useEffect(() => {
    fetchModerationListings('pending')
      .then((items) => setPendingCount(items.length))
      .catch(() => setPendingCount(0));
  }, [listings, reports]);

  useEffect(() => {
    const loadOnline = () => {
      void fetchModerationOnlineStats()
        .then((stats) => {
          setGuestsOnline(stats.guestsOnline);
          setUsersOnline(stats.usersOnline);
        })
        .catch(() => {
          setGuestsOnline(0);
          setUsersOnline(0);
        });
    };
    loadOnline();
    const timer = window.setInterval(loadOnline, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const openListingReview = (listingId: string) => {
    if (tab === 'reports') return;
    setReviewMode({ kind: 'listing', listingId, tab: tab as ListingStatus });
  };

  const openReportReview = (reportId: string) => {
    setReviewMode({ kind: 'report', reportId });
  };

  return (
    <>
      <ProfileExpandableSection title="Панель модератора" count={pendingCount} loading={loading && pendingCount === 0}>
        {canModerate && <span className={styles.adminBadge}>Полные права</span>}
        <div className={styles.onlineStats} aria-label="Пользователи в сети">
          <span className={styles.onlineStat}>
            Гости в сети: <strong>{guestsOnline}</strong>
          </span>
          <span className={styles.onlineStat}>
            Зарегистрированные: <strong>{usersOnline}</strong>
          </span>
        </div>

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
              <> — обновите API: <code>npm run vps:deploy</code></>
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
                <li key={report.id}>
                  <button
                    type="button"
                    className={styles.reportRow}
                    onClick={() => openReportReview(report.id)}
                  >
                    <div className={styles.reportThumb}>!</div>
                    <div className={styles.reportBody}>
                      <p className={styles.reportTitle}>{report.listingTitle}</p>
                      <p className={styles.reportMeta}>
                        {report.reporterName} · {format(new Date(report.createdAt), 'd MMM, HH:mm', { locale: ru })}
                      </p>
                      {report.reason && <p className={styles.reportReason}>{report.reason}</p>}
                    </div>
                    <span className={styles.reportArrow} aria-hidden>→</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : listings.length === 0 ? (
          <p className={styles.status}>
            {tab === 'pending' ? 'Очередь пуста' : 'Записей нет'}
          </p>
        ) : (
          <div className={styles.queue}>
            {listings.map((listing) => (
              <CompactListingRow
                key={listing.id}
                listing={listing}
                onClick={() => openListingReview(listing.id)}
              />
            ))}
          </div>
        )}
      </ProfileExpandableSection>

      {reviewMode && (
        <ModerationReviewModal
          mode={reviewMode}
          onClose={() => setReviewMode(null)}
          onResolved={() => void load()}
        />
      )}
    </>
  );
}

export {
  ModerationDashboard,
};
