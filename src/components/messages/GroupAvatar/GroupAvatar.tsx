import classNames from 'classnames';
import { resolveUploadUrl } from '@/utils/mediaUrl';
import styles from './GroupAvatar.module.css';

interface GroupAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function GroupAvatar({ name, avatarUrl, size = 'md', className }: GroupAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || 'G';
  const resolved = avatarUrl ? resolveUploadUrl(avatarUrl) : undefined;

  if (resolved) {
    return (
      <img
        className={classNames(styles.avatar, styles[size], className)}
        src={resolved}
        alt=""
      />
    );
  }

  return (
    <span
      className={classNames(styles.placeholder, styles[size], className)}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export {
  GroupAvatar,
};
