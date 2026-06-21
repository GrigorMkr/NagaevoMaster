import classNames from 'classnames';
import type { UserRole } from '@/types/user';
import styles from './StaffBadge.module.css';

interface StaffBadgeProps {
  role: UserRole;
  compact?: boolean;
}

function StaffBadge({ role, compact = false }: StaffBadgeProps) {
  if (role !== 'admin' && role !== 'moderator') return null;

  const label = role === 'admin' ? 'Админ сайта' : 'Модератор';

  return (
    <span
      className={classNames(
        styles.badge,
        role === 'admin' ? styles.admin : styles.moderator,
        compact && styles.compact,
      )}
    >
      {label}
    </span>
  );
}

export {
  StaffBadge,
};
