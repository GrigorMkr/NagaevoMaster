import { memo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setSearchParams } from '@/features/filters/filtersSlice';
import { selectSearchParams } from '@/features/filters/filtersSelectors';
import { DISTANCE_FILTER_OPTIONS, DistanceFilter, RATING_FILTER_OPTIONS, RatingFilter, } from '@/enums/filters';
import styles from '../SearchPage.module.css';
interface SearchFiltersProps {
    onApply: () => void;
}
const SearchFilters = memo(function SearchFilters({ onApply }: SearchFiltersProps) {
    const dispatch = useAppDispatch();
    const filters = useAppSelector(selectSearchParams);
    const handlePriceMinChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        dispatch(setSearchParams({ priceMin: value ? Number(value) : null }));
    }, [dispatch]);
    const handlePriceMaxChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        dispatch(setSearchParams({ priceMax: value ? Number(value) : null }));
    }, [dispatch]);
    const handleRatingChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch(setSearchParams({ rating: Number(event.target.value) as RatingFilter }));
    }, [dispatch]);
    const handleDistanceChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        dispatch(setSearchParams({
            distance: value ? (Number(value) as DistanceFilter) : null,
        }));
    }, [dispatch]);
    const handleApplyClick = useCallback(() => {
        onApply();
    }, [onApply]);
    return (<div className={styles.filters}>
      <div className={styles.filterField}>
        <label htmlFor="price-min">Цена от, ₽</label>
        <input id="price-min" name="priceMin" type="number" min="0" className={styles.filterInput} value={filters.priceMin ?? ''} onChange={handlePriceMinChange}/>
      </div>

      <div className={styles.filterField}>
        <label htmlFor="price-max">Цена до, ₽</label>
        <input id="price-max" name="priceMax" type="number" min="0" className={styles.filterInput} value={filters.priceMax ?? ''} onChange={handlePriceMaxChange}/>
      </div>

      <div className={styles.filterField}>
        <label htmlFor="rating-filter">Рейтинг от</label>
        <select id="rating-filter" name="rating" className={styles.filterSelect} value={filters.rating} onChange={handleRatingChange} aria-label="Минимальный рейтинг">
          {RATING_FILTER_OPTIONS.map((rating) => (<option key={rating} value={rating}>
              {rating === RatingFilter.Any ? 'Любой' : `${rating}+`}
            </option>))}
        </select>
      </div>

      <div className={styles.filterField}>
        <label htmlFor="distance-filter">Расстояние, км</label>
        <select id="distance-filter" name="distance" className={styles.filterSelect} value={filters.distance ?? ''} onChange={handleDistanceChange} aria-label="Расстояние от центра">
          <option value="">Любое</option>
          {DISTANCE_FILTER_OPTIONS.map((distance) => (<option key={distance} value={distance}>
              до {distance} км
            </option>))}
        </select>
      </div>

      <button type="button" className={styles.filterApply} onClick={handleApplyClick}>
        Применить фильтры
      </button>
    </div>);
});

export {
  SearchFilters,
}
