import classNames from 'classnames';
import styles from './OnlineStatusDot.module.css';

interface OnlineStatusDotProps {
  online: boolean;
  className?: string;
}

function OnlineStatusDot({ online, className }: OnlineStatusDotProps) {
  return (
    <span
      className={classNames(styles.dot, online ? styles.online : styles.offline, className)}
      aria-label={online ? 'В сети' : 'Не в сети'}
      title={online ? 'В сети' : 'Не в сети'}
    />
  );
}

export {
  OnlineStatusDot,
};
