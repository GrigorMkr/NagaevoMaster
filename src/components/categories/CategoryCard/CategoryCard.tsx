import { memo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import styles from './CategoryCard.module.css';
type CategoryCardVariant = 'tile' | 'row';
interface CategoryCardProps {
    to: string;
    icon: string;
    name: string;
    variant?: CategoryCardVariant;
    className?: string;
    style?: CSSProperties;
}
const CategoryCard = memo(function CategoryCard({ to, icon, name, variant = 'row', className, style, }: CategoryCardProps) {
    const cardClassName = [
        styles.categoryCard,
        variant === 'tile' ? styles.categoryCardTile : styles.categoryCardRow,
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (<Link to={to} className={cardClassName} style={style}>
      <span className={styles.categoryIcon}>{icon}</span>
      <span className={styles.categoryName}>{name}</span>
    </Link>);
});

export {
  CategoryCard,
}

export type {
  CategoryCardProps,
}
