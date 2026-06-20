import { memo } from 'react';
import classNames from 'classnames';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
  listingId: string;
  variant?: 'overlay' | 'inline';
  className?: string;
}

const FavoriteButton = memo(function FavoriteButton({
  listingId,
  variant = 'overlay',
  className,
}: FavoriteButtonProps) {
  const { isFavorite, loading, toggle } = useFavoriteToggle(listingId);

  return (
    <button
      type="button"
      className={classNames(
        styles.favorite,
        variant === 'inline' && styles.inline,
        isFavorite && styles.favoriteActive,
        className,
      )}
      aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
      aria-pressed={isFavorite}
      disabled={loading}
      onClick={(event) => void toggle(event)}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
});

export {
  FavoriteButton,
}
