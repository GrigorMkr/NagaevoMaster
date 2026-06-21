import { memo, useId, useState } from 'react';
import classNames from 'classnames';
import styles from './ProfileExpandableSection.module.css';

interface ProfileExpandableSectionProps {
  title: string;
  count?: number;
  loading?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const ProfileExpandableSection = memo(function ProfileExpandableSection({
  title,
  count,
  loading = false,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: ProfileExpandableSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const panelId = useId();
  const countLabel = loading ? '…' : String(count ?? 0);

  const handleToggle = () => {
    const next = !open;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <section className={classNames(styles.section, open && styles.open)} aria-labelledby={panelId}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={`${panelId}-body`}
        onClick={handleToggle}
      >
        <h2 id={panelId} className={styles.title}>{title}</h2>
        <span className={classNames(styles.count, (count ?? 0) === 0 && !loading && styles.countMuted)}>
          {countLabel}
        </span>
        <span className={styles.chevron} aria-hidden>▸</span>
      </button>

      {open && (
        <div id={`${panelId}-body`} className={styles.body}>
          {loading ? <p className={styles.status}>Загрузка…</p> : children}
        </div>
      )}
    </section>
  );
});

export {
  ProfileExpandableSection,
};
