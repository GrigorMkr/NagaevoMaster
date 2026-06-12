import classNames from 'classnames';
import styles from './Skeleton.module.css';
interface SkeletonProps {
    variant?: 'text' | 'title' | 'card' | 'map';
    className?: string;
}
function Skeleton({ variant = 'text', className }: SkeletonProps) {
    return (<div className={classNames(styles.skeleton, styles[variant], className)} aria-hidden="true"/>);
}

export {
  Skeleton,
}
