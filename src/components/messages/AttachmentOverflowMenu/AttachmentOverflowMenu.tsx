import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import classNames from 'classnames';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import { useAttachmentDownload } from '@/hooks/useAttachmentDownload';
import styles from './AttachmentOverflowMenu.module.css';

interface AttachmentOverflowMenuProps {
  uploadPath: string;
  fileName: string;
  tone?: 'dark' | 'light';
  ariaLabel?: string;
  canForward?: boolean;
  canDelete?: boolean;
  onForward?: () => void;
  onDelete?: () => void;
}

function AttachmentOverflowMenu({
  uploadPath,
  fileName,
  tone = 'dark',
  ariaLabel = 'Действия с файлом',
  canForward = false,
  canDelete = false,
  onForward,
  onDelete,
}: AttachmentOverflowMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { download, busy } = useAttachmentDownload(uploadPath, fileName);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const handleDownload = () => {
    setMenuOpen(false);
    void download();
  };

  const handleForward = () => {
    setMenuOpen(false);
    onForward?.();
  };

  const handleDelete = () => {
    setMenuOpen(false);
    void onDelete?.();
  };

  const stopPropagation = (event: ReactMouseEvent | ReactPointerEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className={styles.wrap}
      ref={menuRef}
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
    >
      <button
        type="button"
        className={classNames(styles.menuBtn, tone === 'dark' ? styles.menuBtnDark : styles.menuBtnLight)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <ToolbarIcon name="menu" accent="currentColor" motion="none" />
      </button>
      {menuOpen && (
        <div className={styles.menu} role="menu">
          {canForward && (
            <button type="button" role="menuitem" onClick={handleForward}>
              Переслать
            </button>
          )}
          <button type="button" role="menuitem" onClick={handleDownload} disabled={busy}>
            {busy ? 'Скачивание…' : 'Скачать'}
          </button>
          {canDelete && (
            <button type="button" role="menuitem" className={styles.menuDanger} onClick={handleDelete}>
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export {
  AttachmentOverflowMenu,
};
