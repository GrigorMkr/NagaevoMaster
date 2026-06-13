import classNames from 'classnames';
import styles from './UserAvatar.module.css';

interface UserAvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function UserAvatar({ name, src, size = 'md', className }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      className={classNames(styles.avatar, styles[size], className)}
      aria-hidden="true"
    >
      {src ? (
        <img className={styles.image} src={src} alt="" loading="lazy" />
      ) : (
        <span className={styles.fallback}>{initials || 'Н'}</span>
      )}
    </span>
  );
}

export {
  UserAvatar,
}
