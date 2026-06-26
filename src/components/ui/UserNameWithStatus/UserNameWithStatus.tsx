import classNames from 'classnames';
import { OnlineStatusDot } from '@/components/ui/OnlineStatusDot/OnlineStatusDot';
import styles from './UserNameWithStatus.module.css';

interface UserNameWithStatusProps {
  name: string;
  userId?: string;
  online?: boolean;
  className?: string;
  nameClassName?: string;
}

function UserNameWithStatus({
  name,
  userId,
  online,
  className,
  nameClassName,
}: UserNameWithStatusProps) {
  return (
    <span className={classNames(styles.wrap, className)}>
      <span className={nameClassName}>{name}</span>
      {userId && typeof online === 'boolean' ? (
        <OnlineStatusDot online={online} />
      ) : null}
    </span>
  );
}

export {
  UserNameWithStatus,
};
