import { memo } from 'react';
import classNames from 'classnames';
import { MAP_CATEGORY_FILTER_LIMIT } from '@/constants';
import { SERVICE_CATEGORIES } from '@/data/categories';
import { getCategoryCover } from '@/data/mock/listingImages';
import styles from './ProvidersMap.module.css';
interface MapFiltersProps {
    categoryFilter: string | null;
    onFilterChange: (category: string | null) => void;
}
const MapFilters = memo(function MapFilters({ categoryFilter, onFilterChange, }: MapFiltersProps) {
    return (<div className={styles.controls}>
      <button type="button" className={classNames(styles.filterButton, !categoryFilter && styles.filterButtonActive)} onClick={() => onFilterChange(null)}>
        Все на карте
      </button>
      {SERVICE_CATEGORIES.slice(0, MAP_CATEGORY_FILTER_LIMIT).map((cat) => (<button key={cat.slug} type="button" className={classNames(styles.filterButton, categoryFilter === cat.slug && styles.filterButtonActive)} onClick={() => onFilterChange(cat.slug)}>
          <img className={styles.filterThumb} src={getCategoryCover(cat.slug)} alt="" loading="lazy" />
          <span>{cat.name.split(' ')[0]}</span>
        </button>))}
    </div>);
});

export {
  MapFilters,
}
