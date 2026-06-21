import { memo, useCallback } from 'react';
import { SORT_BY_LABELS, type SortBy } from '@/enums/sort';
import styles from './ListingSortControls.module.css';

interface ListingSortControlsProps {
  activeSort: SortBy;
  options: readonly SortBy[];
  onSort: (sort: SortBy) => void;
  label?: string;
}

const ListingSortControls = memo(function ListingSortControls({
  activeSort,
  options,
  onSort,
  label = 'Сортировка',
}: ListingSortControlsProps) {
  const handleClick = useCallback((sort: SortBy) => () => onSort(sort), [onSort]);

  return (
    <div className={styles.row} role="group" aria-label={label}>
      {options.map((sort) => (
        <button
          key={sort}
          type="button"
          className={activeSort === sort ? styles.buttonActive : styles.button}
          onClick={handleClick(sort)}
        >
          {SORT_BY_LABELS[sort]}
        </button>
      ))}
    </div>
  );
});

export {
  ListingSortControls,
};
