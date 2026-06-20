import type { ListingStatus } from '@/types/listing';
import styles from './ListingStatusBadge.module.css';

const LABELS: Record<ListingStatus, string> = {
  pending: 'На модерации',
  published: 'Опубликовано',
  rejected: 'Отклонено',
};

interface ListingStatusBadgeProps {
  status?: ListingStatus;
}

function ListingStatusBadge({ status = 'published' }: ListingStatusBadgeProps) {
  const className = styles[status] ?? styles.published;
  return <span className={`${styles.statusBadge} ${className}`}>{LABELS[status]}</span>;
}

export {
  ListingStatusBadge,
}
