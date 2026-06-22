import { memo, useCallback, useState } from 'react';
import classNames from 'classnames';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { Listing } from '@/types/listing';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '@/features/user/userSelectors';
import { setListingReaction } from '@/features/listingReactions/listingReactionsSlice';
import { setListingReaction as setListingReactionApi } from '@/services/listingSocialApi';
import { RepostListingModal } from '@/components/listings/RepostListingModal/RepostListingModal';
import { ROUTES } from '@/constants';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './ListingSocialBar.module.css';

interface ListingSocialBarProps {
  listing: Listing;
  compact?: boolean;
  className?: string;
  onStatsChange?: (stats: {
    likesCount: number;
    dislikesCount: number;
    repostsCount?: number;
  }) => void;
}

const ListingSocialBar = memo(function ListingSocialBar({
  listing,
  compact = false,
  className,
  onStatsChange,
}: ListingSocialBarProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const userReaction = useAppSelector((state) => state.listingReactions.byListingId[listing.id]);
  const [likesCount, setLikesCount] = useState(listing.likesCount ?? 0);
  const [dislikesCount, setDislikesCount] = useState(listing.dislikesCount ?? 0);
  const [repostsCount, setRepostsCount] = useState(listing.repostsCount ?? 0);
  const [loading, setLoading] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);

  const isOwner = currentUser?.id === listing.userId;

  const requireAuth = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы взаимодействовать с объявлением');
      navigate(ROUTES.AUTH);
      return false;
    }
    return true;
  }, [isAuthenticated, navigate]);

  const handleReaction = async (event: React.MouseEvent, value: 1 | -1) => {
    event.preventDefault();
    event.stopPropagation();
    if (!requireAuth(event) || isOwner) return;

    const nextValue = userReaction === value ? 0 : value;
    setLoading(true);
    try {
      const result = await setListingReactionApi(listing.id, nextValue);
      dispatch(setListingReaction({ listingId: listing.id, value: result.value }));
      setLikesCount(result.likesCount);
      setDislikesCount(result.dislikesCount);
      onStatsChange?.({
        likesCount: result.likesCount,
        dislikesCount: result.dislikesCount,
        repostsCount,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось поставить оценку'));
    } finally {
      setLoading(false);
    }
  };

  const handleRepostClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!requireAuth(event)) return;
    setRepostOpen(true);
  };

  const handleReposted = (nextRepostsCount: number) => {
    setRepostsCount(nextRepostsCount);
    onStatsChange?.({ likesCount, dislikesCount, repostsCount: nextRepostsCount });
    setRepostOpen(false);
    toast.success('Объявление отправлено');
  };

  return (
    <>
      <div
        className={classNames(styles.bar, compact && styles.barCompact, className)}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={classNames(styles.btn, userReaction === 1 && styles.btnActiveLike)}
          aria-label="Нравится"
          aria-pressed={userReaction === 1}
          disabled={loading || isOwner}
          title={isOwner ? 'Нельзя оценивать своё объявление' : 'Нравится'}
          onClick={(event) => void handleReaction(event, 1)}
        >
          <span className={styles.icon}>👍</span>
          <span className={styles.count}>{likesCount}</span>
        </button>

        <button
          type="button"
          className={classNames(styles.btn, userReaction === -1 && styles.btnActiveDislike)}
          aria-label="Не нравится"
          aria-pressed={userReaction === -1}
          disabled={loading || isOwner}
          title={isOwner ? 'Нельзя оценивать своё объявление' : 'Не нравится'}
          onClick={(event) => void handleReaction(event, -1)}
        >
          <span className={styles.icon}>👎</span>
          <span className={styles.count}>{dislikesCount}</span>
        </button>

        <button
          type="button"
          className={styles.btn}
          aria-label="Репост в личку"
          onClick={handleRepostClick}
        >
          <span className={styles.icon}>↪</span>
          <span className={styles.label}>{compact ? '' : 'Репост'}</span>
        </button>

        {isOwner && (
          <span className={styles.ownerStat} title="Сколько раз отправили в личку">
            <span className={styles.icon}>📤</span>
            <span className={styles.count}>{repostsCount}</span>
            {!compact && <span className={styles.ownerLabel}>репостов</span>}
          </span>
        )}
      </div>

      {repostOpen && (
        <RepostListingModal
          listing={listing}
          onClose={() => setRepostOpen(false)}
          onDone={handleReposted}
        />
      )}
    </>
  );
});

export {
  ListingSocialBar,
};
