import { memo } from 'react'
import classNames from 'classnames'
import { SERVICE_CATEGORIES } from '@/data/categories'
import styles from './ProvidersMap.module.css'

interface MapFiltersProps {
  categoryFilter: string | null
  onFilterChange: (category: string | null) => void
}

export const MapFilters = memo(function MapFilters({
  categoryFilter,
  onFilterChange,
}: MapFiltersProps) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={classNames(styles.filterBtn, !categoryFilter && styles.filterBtnActive)}
        onClick={() => onFilterChange(null)}
      >
        Все на карте
      </button>
      {SERVICE_CATEGORIES.slice(0, 6).map((cat) => (
        <button
          key={cat.slug}
          type="button"
          className={classNames(
            styles.filterBtn,
            categoryFilter === cat.slug && styles.filterBtnActive,
          )}
          onClick={() => onFilterChange(cat.slug)}
        >
          {cat.icon} {cat.name.split(' ')[0]}
        </button>
      ))}
    </div>
  )
})
