import { memo, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { ListingGallery } from '@/components/listings/ListingGallery/ListingGallery';
import { ListingStatusBadge } from '@/components/listings/ListingStatusBadge/ListingStatusBadge';
import { Button } from '@/components/ui/Button/Button';
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen/AppLoadingScreen';
import { BAN_POLICY_TEXT, CONTENT_VIOLATION_MESSAGE } from '@/constants/communityRules';
import {
  adminEditModerationListing,
  banModerationUser,
  deleteModerationListing,
  fetchModerationListing,
  fetchModerationReport,
  moderateListingStatus,
  unbanModerationUser,
  updateReportStatus,
  type ModerationListingDetail,
  type ModerationReport,
  type ModerationReportDetail,
} from '@/services/moderationApi';
import type { Listing, ListingStatus } from '@/types/listing';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './ModerationReviewModal.module.css';

type ReviewMode =
  | { kind: 'listing'; listingId: string; tab: ListingStatus }
  | { kind: 'report'; reportId: string };

interface ModerationReviewModalProps {
  mode: ReviewMode;
  onClose: () => void;
  onResolved: () => void;
}

function detectLocalViolations(title: string, description: string): string[] {
  const text = `${title}\n${description}`.toLowerCase().replace(/[ё]/g, 'е');
  const labels: string[] = [];
  if (/\b(хуй|пизд|еба?т|бля|сука|мудак|пидор)\w*/i.test(text)) {
    labels.push('нецензурная брань');
  }
  if (/\bсво\b|специальн\w*\s+военн|разжиган\w*\s+ненавист/i.test(text)) {
    labels.push('пропаганда / СВО');
  }
  if (/наркот|героин|кокаин|мефедрон|марихуан|спайс/i.test(text)) {
    labels.push('наркотики');
  }
  return labels;
}

const ModerationReviewModal = memo(function ModerationReviewModal({
  mode,
  onClose,
  onResolved,
}: ModerationReviewModalProps) {
  const [listing, setListing] = useState<ModerationListingDetail | null>(null);
  const [report, setReport] = useState<ModerationReportDetail | ModerationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banReason, setBanReason] = useState(BAN_POLICY_TEXT);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        if (mode.kind === 'listing') {
          const item = await fetchModerationListing(mode.listingId);
          if (!cancelled) {
            setListing(item);
            setEditTitle(item.title);
            setEditDescription(item.description);
            setReport(null);
          }
        } else {
          const item = await fetchModerationReport(mode.reportId);
          if (!cancelled) {
            setReport(item);
            setListing({ ...item.listing, authorMeta: item.authorMeta });
            setEditTitle(item.listing.title);
            setEditDescription(item.listing.description);
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error, 'Не удалось загрузить материал'));
          onClose();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [mode, onClose]);

  const activeListing: Listing | null = listing ?? (report && 'listing' in report ? report.listing : null);
  const authorMeta = listing?.authorMeta ?? (report && 'authorMeta' in report ? report.authorMeta : undefined);

  const violations = useMemo(() => {
    if (!activeListing) return [];
    const fromApi = listing?.contentViolations ?? [];
    const local = detectLocalViolations(
      isEditing ? editTitle : activeListing.title,
      isEditing ? editDescription : activeListing.description,
    );
    return [...new Set([...fromApi, ...local])];
  }, [activeListing, listing?.contentViolations, isEditing, editTitle, editDescription]);

  const handleModerate = async (status: 'published' | 'rejected') => {
    if (!activeListing) return;
    setBusy(true);
    try {
      await moderateListingStatus(activeListing.id, status);
      toast.success(status === 'published' ? 'Объявление одобрено' : 'Объявление отклонено');
      onResolved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ошибка модерации'));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeListing) return;
    setBusy(true);
    try {
      const updated = await adminEditModerationListing(activeListing.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setListing((current) => ({ ...current, ...updated }));
      setIsEditing(false);
      toast.success('Объявление обновлено');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось сохранить изменения'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!activeListing) return;
    if (!window.confirm('Удалить объявление безвозвратно?')) return;
    setBusy(true);
    try {
      await deleteModerationListing(activeListing.id);
      toast.success('Объявление удалено');
      onResolved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось удалить объявление'));
    } finally {
      setBusy(false);
    }
  };

  const handleBan = async () => {
    if (!authorMeta || authorMeta.isBanned) return;
    if (!window.confirm(`Заблокировать ${authorMeta.name} навсегда?`)) return;
    setBusy(true);
    try {
      await banModerationUser(authorMeta.id, banReason.trim() || BAN_POLICY_TEXT);
      toast.success('Пользователь заблокирован');
      onResolved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось заблокировать пользователя'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnban = async () => {
    if (!authorMeta) return;
    setBusy(true);
    try {
      await unbanModerationUser(authorMeta.id);
      toast.success('Пользователь разблокирован');
      onResolved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось разблокировать'));
    } finally {
      setBusy(false);
    }
  };

  const handleReportAction = async (
    status: 'resolved' | 'dismissed',
    options?: { rejectListing?: boolean; banAuthor?: boolean },
  ) => {
    if (mode.kind !== 'report') return;
    setBusy(true);
    try {
      await updateReportStatus(mode.reportId, {
        status,
        rejectListing: options?.rejectListing,
        banAuthor: options?.banAuthor,
        banReason: options?.banAuthor ? banReason.trim() || BAN_POLICY_TEXT : undefined,
      });
      toast.success(status === 'resolved' ? 'Жалоба обработана' : 'Жалоба отклонена');
      onResolved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось обновить жалобу'));
    } finally {
      setBusy(false);
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={handleOverlayClick}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="moderation-review-title">
        <header className={styles.header}>
          <h3 id="moderation-review-title" className={styles.title}>
            {mode.kind === 'report' ? 'Проверка жалобы' : 'Проверка объявления'}
            <span className={styles.adminBadge}>Модератор</span>
          </h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        {loading ? (
          <AppLoadingScreen fullscreen={false} label="Загрузка…" />
        ) : activeListing ? (
          <div className={styles.body}>
            {activeListing.status && <ListingStatusBadge status={activeListing.status} />}

            {violations.length > 0 && (
              <div className={styles.violationBox} role="alert">
                <strong>⚠ Обнаружены нарушения:</strong>
                <ul>
                  {violations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>{CONTENT_VIOLATION_MESSAGE}</p>
              </div>
            )}

            {mode.kind === 'report' && report && (
              <div className={styles.reportBox}>
                <p className={styles.reportLine}>
                  <strong>Жалоба от:</strong> {report.reporterName} ({report.reporterEmail})
                </p>
                <p className={styles.reportLine}>
                  <strong>Дата:</strong>{' '}
                  {format(new Date(report.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                </p>
                {report.reason && (
                  <p className={styles.reportReason}>
                    <strong>Причина:</strong> {report.reason}
                  </p>
                )}
              </div>
            )}

            {authorMeta && (
              <div className={styles.authorBox}>
                <p><strong>Автор:</strong> {authorMeta.name}</p>
                <p className={styles.muted}>{authorMeta.email}</p>
                {authorMeta.role === 'admin' && <p className={styles.adminTag}>Администратор</p>}
                {authorMeta.role === 'moderator' && <p className={styles.adminTag}>Модератор</p>}
                {authorMeta.isBanned && <p className={styles.bannedTag}>Заблокирован</p>}
              </div>
            )}

            {isEditing ? (
              <>
                <label className={styles.banLabel} htmlFor="edit-title">Заголовок</label>
                <input
                  id="edit-title"
                  className={styles.textInput}
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                />
                <label className={styles.banLabel} htmlFor="edit-desc">Описание</label>
                <textarea
                  id="edit-desc"
                  className={styles.banInput}
                  rows={5}
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                />
                <div className={styles.actions}>
                  <Button loading={busy} onClick={() => void handleSaveEdit()}>Сохранить</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Отмена</Button>
                </div>
              </>
            ) : (
              <>
                <h4 className={styles.listingTitle}>{activeListing.title}</h4>
                <p className={styles.priceMeta}>
                  от {activeListing.priceFrom} ₽ / {activeListing.unit}
                </p>
                <ListingGallery images={activeListing.images} title={activeListing.title} />
                <p className={styles.desc}>{activeListing.description}</p>
                <p className={styles.meta}>
                  📍 {activeListing.location.address} · 📞 {activeListing.phone}
                </p>
              </>
            )}

            <label className={styles.banLabel} htmlFor="ban-reason">
              Причина блокировки (при бане)
            </label>
            <textarea
              id="ban-reason"
              className={styles.banInput}
              rows={3}
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
            />

            {!isEditing && (
              <div className={styles.actions}>
                {(activeListing.status === 'pending'
                  || activeListing.status === 'rejected'
                  || mode.kind === 'report') && (
                  <>
                    <Button loading={busy} onClick={() => void handleModerate('published')}>
                      Одобрить
                    </Button>
                    {activeListing.status !== 'rejected' && (
                      <Button loading={busy} variant="outline" onClick={() => void handleModerate('rejected')}>
                        Отклонить
                      </Button>
                    )}
                  </>
                )}

                <Button loading={busy} variant="secondary" onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>

                <Button loading={busy} variant="danger" onClick={() => void handleDelete()}>
                  Удалить
                </Button>

                {mode.kind === 'report' && report?.status === 'pending' && (
                  <>
                    <Button
                      loading={busy}
                      variant="secondary"
                      onClick={() => void handleReportAction('resolved', { rejectListing: true })}
                    >
                      Отклонить объявление и закрыть жалобу
                    </Button>
                    <Button
                      loading={busy}
                      variant="danger"
                      onClick={() => void handleReportAction('resolved', { rejectListing: true, banAuthor: true })}
                    >
                      Бан + отклонить
                    </Button>
                    <Button
                      loading={busy}
                      variant="outline"
                      onClick={() => void handleReportAction('dismissed')}
                    >
                      Отклонить жалобу
                    </Button>
                  </>
                )}

                {authorMeta && !authorMeta.isBanned && (
                  <Button loading={busy} variant="danger" onClick={() => void handleBan()}>
                    Забанить автора
                  </Button>
                )}

                {authorMeta?.isBanned && (
                  <Button loading={busy} variant="outline" onClick={() => void handleUnban()}>
                    Разблокировать автора
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className={styles.muted}>Материал не найден</p>
        )}
      </div>
    </div>
  );
});

export {
  ModerationReviewModal,
};

export type {
  ReviewMode,
};
