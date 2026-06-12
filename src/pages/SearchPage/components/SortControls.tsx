import { memo, useCallback } from 'react';
import { SORT_BY_LABELS, SORT_BY_OPTIONS } from '@/enums';
import type { SortBy } from '@/types/search';
import styles from '../SearchPage.module.css';
interface SortControlsProps {
    activeSort: SortBy;
    onSort: (sort: SortBy) => void;
}
const SortControls = memo(function SortControls({ activeSort, onSort }: SortControlsProps) {
    const handleClick = useCallback((sort: SortBy) => () => onSort(sort), [onSort]);
    return (<div className={styles.sortRow}>
      {SORT_BY_OPTIONS.map((sort) => (<button key={sort} type="button" className={activeSort === sort ? styles.sortButtonActive : styles.sortButton} onClick={handleClick(sort)}>
          {SORT_BY_LABELS[sort]}
        </button>))}
    </div>);
});

export {
  SortControls,
}
