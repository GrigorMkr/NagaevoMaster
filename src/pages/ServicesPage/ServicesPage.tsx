import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CategoryCard } from '@/components/categories/CategoryCard/CategoryCard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { ListingSortControls } from '@/components/listings/ListingSortControls/ListingSortControls';
import { SKELETON_COUNT_DEFAULT } from '@/constants';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchListingsThunk } from '@/features/listings/listingsThunks';
import { selectListingsItems, selectListingsLoading } from '@/features/listings/listingsSelectors';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import { SERVICE_CATEGORIES } from '@/data/categories';
import { getCategoryCover } from '@/data/mock/listingImages';
import { SortBy, SERVICE_SORT_OPTIONS } from '@/enums/sort';
import { servicesCategoryPath, searchPath, ROUTES } from '@/utils/constants';
import { savePendingSearchQuery } from '@/constants/user-location';
import tileGrid from '@/styles/tileGrid.module.css';
import pageStyles from '@/styles/page.module.css';
import styles from './ServicesPage.module.css';
const searchSchema = z.object({
    search: z.string().optional(),
});
type SearchFormData = z.infer<typeof searchSchema>;
function ServicesPage() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const items = useAppSelector(selectListingsItems);
    const isLoading = useAppSelector(selectListingsLoading);
    const filters = useAppSelector((state) => state.filters);
    const [sortBy, setSortBy] = useState<SortBy>(SortBy.Popular);
    const { register, handleSubmit } = useForm<SearchFormData>({
        resolver: zodResolver(searchSchema),
        defaultValues: { search: filters.query ?? '' },
    });
    useEffect(() => {
        dispatch(fetchListingsThunk({ sortBy, kind: 'service' }));
    }, [dispatch, sortBy]);
    const onSubmit = (data: SearchFormData) => {
        const query = data.search ?? '';
        if (query.trim()) {
            savePendingSearchQuery(query);
        }
        navigate(searchPath(query));
    };
    return (<>
      <PageMeta title="Услуги" description="Каталог услуг и специалистов в поселке Нагаево и окрестностях." canonical="/services"/>

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Каталог" title="Услуги" />

          <Reveal delay={60}>
            <form className={styles.searchForm} action={ECHO_FORM_ACTION} method="get" onSubmit={handleSubmit(onSubmit)}>
              <label className="sr-only" htmlFor="services-search">
                Поиск по каталогу
              </label>
              <input id="services-search" type="search" required placeholder="Поиск: ремонт, трактор, уборка..." className={pageStyles.input} {...register('search')}/>
              <button type="submit" className={styles.searchButton}>Найти</button>
            </form>
          </Reveal>

          <Reveal delay={100}>
            <div className={`${styles.categoryGrid} motion-stagger`}>
              {SERVICE_CATEGORIES.map((cat) => (<CategoryCard key={cat.slug} to={servicesCategoryPath(cat.slug)} icon={cat.icon} name={cat.name} cover={getCategoryCover(cat.slug)}/>))}
            </div>
          </Reveal>

          {isLoading && (<Reveal delay={120}>
              <div className={tileGrid.grid}>
                {Array.from({ length: SKELETON_COUNT_DEFAULT }, (_, i) => (<Skeleton key={i} variant="card"/>))}
              </div>
            </Reveal>)}

          {!isLoading && items.length > 0 && (<Reveal delay={140}>
              <h2 className={styles.listTitle}>Все объявления</h2>
              <ListingSortControls
                activeSort={sortBy}
                options={SERVICE_SORT_OPTIONS}
                onSort={setSortBy}
              />
              <div className={`${tileGrid.grid} motion-stagger`}>
                {items.map((listing) => (<ListingCard key={listing.id} listing={listing}/>))}
              </div>
            </Reveal>)}

          {!isLoading && items.length === 0 && (<Reveal delay={120}>
              <div className={pageStyles.empty}>
              <span className={pageStyles.emptyIcon}>🔍</span>
              <p className={pageStyles.emptyTitle}>Каталог скоро наполнится</p>
              <p className={pageStyles.emptyHint}>
                <Link to={ROUTES.ADD_LISTING}>Добавьте объявление</Link> или подключите backend API
              </p>
            </div>
          </Reveal>)}
        </div>
      </div>
    </>);
}

export {
  ServicesPage,
}
