import { useCallback, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import styles from './DetailBackdropLayout.module.css';

interface DetailBackdropLayoutProps {
  children: ReactNode;
  className?: string;
  onBackdropClick?: () => void;
}

function DetailBackdropLayout({
  children,
  className,
  onBackdropClick,
}: DetailBackdropLayoutProps) {
  const navigate = useNavigate();

  const handleBackdropClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-detail-surface]')) {
      return;
    }
    if (onBackdropClick) {
      onBackdropClick();
      return;
    }
    navigate(-1);
  }, [navigate, onBackdropClick]);

  return (
    <div
      className={classNames(styles.layout, className)}
      onClick={handleBackdropClick}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          if (onBackdropClick) onBackdropClick();
          else navigate(-1);
        }
      }}
      role="presentation"
    >
      {children}
    </div>
  );
}

export {
  DetailBackdropLayout,
};
