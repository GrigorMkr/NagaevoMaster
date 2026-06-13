import { memo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import styles from './CategoryCard.module.css';
type CategoryCardVariant = 'tile' | 'row';
interface CategoryCardProps {
    to: string;
    icon: string;
    name: string;
    cover?: string;
    variant?: CategoryCardVariant;
    className?: string;
    style?: CSSProperties;
}
const CategoryCard = memo(function CategoryCard({ to, icon, name, cover, variant = 'row', className, style, }: CategoryCardProps) {
    const cardClassName = [
        styles.categoryCard,
        variant === 'tile' ? styles.categoryCardTile : styles.categoryCardRow,
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (<Link to={to} data-ui="card" className={cardClassName} style={style}>
      {cover ? (
        <span className={styles.categoryThumb}>
          <ListingPhoto className={styles.categoryThumbImage} src={cover} alt="" loading="lazy" />
        </span>
      ) : (
        <span className={styles.categoryIcon}>{icon}</span>
      )}
      <span className={styles.categoryName}>{name}</span>
    </Link>);
});

export {
  CategoryCard,
}

export type {
  CategoryCardProps,
}
