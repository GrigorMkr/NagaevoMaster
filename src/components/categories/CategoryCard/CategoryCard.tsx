import { memo, type CSSProperties } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import type { AppIconName } from '@/types/icon';
import { RichIcon } from '@/components/ui/RichIcon';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import { getCategoryIconAccent } from '@/utils/categoryIconTheme';
import styles from './CategoryCard.module.css';

type CategoryCardVariant = 'tile' | 'row';

interface CategoryCardProps {
  to: string;
  icon: AppIconName;
  name: string;
  categorySlug?: string;
  iconAccent?: string;
  cover?: string;
  variant?: CategoryCardVariant;
  className?: string;
  style?: CSSProperties;
}

const CategoryCard = memo(function CategoryCard({
  to,
  icon,
  name,
  categorySlug,
  iconAccent,
  cover,
  variant = 'row',
  className,
  style,
}: CategoryCardProps) {
  const accent = iconAccent ?? (categorySlug ? getCategoryIconAccent(categorySlug) : '#7ec8a8');
  const cardClassName = [
    styles.categoryCard,
    variant === 'tile' ? styles.categoryCardTile : styles.categoryCardRow,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link to={to} data-ui="card" className={cardClassName} style={style}>
      <span className={classNames(styles.categoryThumb, !cover && styles.categoryThumbIconOnly)}>
        {cover ? (
          <ListingPhoto className={styles.categoryThumbImage} src={cover} alt="" loading="lazy" />
        ) : null}
        <RichIcon
          name={icon}
          variant="gem"
          size={cover ? 'md' : 'lg'}
          accent={accent}
          motion="float"
          className={cover ? styles.categoryIconOverlay : styles.categoryIcon}
        />
      </span>
      <span className={styles.categoryName}>{name}</span>
    </Link>
  );
});

export {
  CategoryCard,
};

export type {
  CategoryCardProps,
};
