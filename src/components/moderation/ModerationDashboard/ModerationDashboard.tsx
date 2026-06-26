import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAppSelector } from '@/app/hooks';
import { selectCanModerate, selectIsAdmin } from '@/features/user/userSelectors';
import { CompactListingRow } from '@/components/listings/CompactListingRow/CompactListingRow';
import { NewsAdminPanel } from '@/components/moderation/NewsAdminPanel/NewsAdminPanel';
import { AdminDashboardOverview } from '@/components/moderation/AdminDashboardOverview/AdminDashboardOverview';
import { AdminUsersPanel } from '@/components/moderation/AdminUsersPanel/AdminUsersPanel';
import { AdminDevApkPanel } from '@/components/moderation/AdminDevApkPanel/AdminDevApkPanel';
import { CircularStatRing } from '@/components/ui/CircularStatRing/CircularStatRing';
import { ProfileExpandableSection } from '@/components/profile/ProfileExpandableSection/ProfileExpandableSection';
import { ModerationReviewModal, type ReviewMode } from '@/components/moderation/ModerationReviewModal/ModerationReviewModal';
import {
  fetchAdminDashboardStats,
  fetchModerationListings,
  fetchModerationReports,
} from '@/services/moderationApi';
import type { AdminDashboardStats } from '@/services/moderationApi';
import type { Listing, ListingStatus } from '@/types/listing';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './ModerationDashboard.module.css';

type TabId = 'overview' | 'pending' | 'published' | 'rejected' | 'reports' | 'news' | 'users' | 'mobile';

const BASE_TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'pending', label: 'На модерации' },
  { id: 'published', label: 'Одобренные' },
  { id: 'rejected', label: 'Отклонённые' },
  { id: 'reports', label: 'Жалобы' },
  { id: 'news', label: 'Новости' },
];

function ModerationDashboard() {
  const canModerate = useAppSelector(selectCanModerate);
  const isAdmin = useAppSelector(selectIsAdmin);
  const tabs = useMemo(
    () => (isAdmin
      ? [
          ...BASE_TABS,
          { id: 'mobile' as const, label: 'Приложение' },
          { id: 'users' as const, label: 'Пользователи' },
        ]
      : BASE_TABS),
    [isAdmin],
  );
  const [tab, setTab] = useState<TabId>('overview');
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Awaited<ReturnType<typeof fetchModerationReports>>>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode | null>(null);

  const loadTabData = useCallback(async () => {
    if (tab === 'overview' || tab === 'users' || tab === 'mobile') {
      setListings([]);
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      if (tab === 'reports') {
        setReports(await fetchModerationReports('all'));
        setListings([]);
      } else if (tab === 'news') {
        setReports([]);
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

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const stats = await fetchAdminDashboardStats();
      setDashboardStats(stats);
      setPendingCount(stats.moderation.listingsPending);
    } catch {
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTabData();
  }, [loadTabData]);

  useEffect(() => {
    void loadStats();
    const timer = window.setInterval(() => void loadStats(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadStats]);

  const openListingReview = (listingId: string) => {
    if (tab === 'reports') return;
    setReviewMode({ kind: 'listing', listingId, tab: tab as ListingStatus });
  };

  const openReportReview = (reportId: string) => {
    setReviewMode({ kind: 'report', reportId });
  };

  const panelTitle = isAdmin ? 'Панель администратора' : 'Панель модератора';

  return (
    <>
      <ProfileExpandableSection title={panelTitle} count={pendingCount} loading={statsLoading && pendingCount === 0}>
        {isAdmin ? (
          <span className={styles.adminBadge}>Администратор</span>
        ) : (
          canModerate && <span className={styles.adminBadge}>Модератор</span>
        )}

        {dashboardStats && (
          <div className={styles.liveBar} aria-label="Краткая сводка">
            <CircularStatRing
              compact
              label="В сети"
              value={dashboardStats.presence.totalOnline}
              max={Math.max(dashboardStats.users.total, 1)}
              accent="gold"
            />
            <CircularStatRing
              compact
              label="Пользователей"
              value={dashboardStats.users.online}
              max={Math.max(dashboardStats.users.total, 1)}
            />
            <CircularStatRing
              compact
              label="Рег. сегодня"
              value={dashboardStats.users.registeredToday}
              max={Math.max(dashboardStats.users.total, 1)}
              accent="gold"
            />
            <CircularStatRing
              compact
              label="Объявл. сегодня"
              value={dashboardStats.listings.addedToday}
              max={Math.max(dashboardStats.listings.total, 1)}
              accent="blue"
            />
          </div>
        )}

        <div className={styles.tabs} role="tablist" aria-label="Разделы модерации">
          {tabs.map((item) => (
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

        {tab === 'overview' ? (
          statsLoading && !dashboardStats ? (
            <p className={styles.status}>Загрузка статистики…</p>
          ) : dashboardStats ? (
            <AdminDashboardOverview stats={dashboardStats} />
          ) : (
            <p className={styles.status}>Статистика недоступна — обновите API</p>
          )
        ) : tab === 'users' ? (
          isAdmin ? <AdminUsersPanel /> : null
        ) : tab === 'mobile' ? (
          isAdmin ? <AdminDevApkPanel /> : null
        ) : loading && tab !== 'news' ? (
          <p className={styles.status}>Загрузка…</p>
        ) : tab === 'news' ? (
          <NewsAdminPanel />
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
                        {report.reporterName}
                        {' · '}
                        {format(new Date(report.createdAt), 'd MMM, HH:mm', { locale: ru })}
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
          onResolved={() => {
            void loadTabData();
            void loadStats();
          }}
        />
      )}
    </>
  );
}

export {
  ModerationDashboard,
};
