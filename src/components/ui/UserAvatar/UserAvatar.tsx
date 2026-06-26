import { useState } from 'react';
import classNames from 'classnames';
import styles from './UserAvatar.module.css';

interface UserAvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showBirthdayCake?: boolean;
}

function UserAvatar({ name, src, size = 'md', className, showBirthdayCake = false }: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const showImage = Boolean(src) && !imageFailed;

  return (
    <span
      className={classNames(styles.avatar, styles[size], showBirthdayCake && styles.withBadge, className)}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={styles.fallback}>{initials || 'Н'}</span>
      )}
      {showBirthdayCake && (
        <span className={styles.birthdayBadge} title="День рождения">🎂</span>
      )}
    </span>
  );
}

export {
  UserAvatar,
}
