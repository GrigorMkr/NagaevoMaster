import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { ButtonLink } from '@/components/ui/Button/ButtonLink';
import { ListingCard } from '@/components/listings/ListingCard/ListingCard';
import { ListingSortControls } from '@/components/listings/ListingSortControls/ListingSortControls';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchListingsThunk } from '@/features/listings/listingsThunks';
import { selectListingsItems, selectListingsLoading } from '@/features/listings/listingsSelectors';
import { getBoardKindConfig } from '@/data/boardKinds';
import type { BoardCategory } from '@/data/boardKinds';
import type { ListingKind } from '@/types/listing';
import { SortBy, SERVICE_SORT_OPTIONS } from '@/enums/sort';
import { addListingPath, boardPath, ROUTES } from '@/constants';
import tileGrid from '@/styles/tileGrid.module.css';
import pageStyles from '@/styles/page.module.css';
import styles from './BoardKindPage.module.css';

const BOARD_KIND_SLUGS = new Set(['sale', 'vacancy', 'lost']);
type BoardKindSlug = Exclude<ListingKind, 'service'>;

function BoardKindPage() {
  const { kind: kindParam } = useParams<{ kind: string }>();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectListingsItems);
  const isLoading = useAppSelector(selectListingsLoading);
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Newest);

  const kind: BoardKindSlug | null = kindParam && BOARD_KIND_SLUGS.has(kindParam)
    ? (kindParam as BoardKindSlug)
    : null;
  const config = kind ? getBoardKindConfig(kind) : undefined;

  useEffect(() => {
    if (!kind) return;
    dispatch(fetchListingsThunk({
      kind,
      category: category ?? undefined,
      sortBy,
    }));
  }, [dispatch, kind, category, sortBy]);

  const filtered = useMemo(() => {
    if (!category) return items;
    return items.filter((item) => item.category === category);
  }, [category, items]);

  if (!kind || !config) {
    return (
      <div className={pageStyles.page}>
        <div className="container">
          <p>Раздел не найден</p>
          <Link to={boardPath()}>← На доску</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={config.title}
        description={config.description}
        canonical={`/board/${kind}`}
      />
      <div className={pageStyles.page}>
        <div className="container">
          <Reveal>
            <Link to={boardPath()} className={styles.back}>← Доска</Link>
            <header
              className={styles.hero}
              style={{
                '--board-accent': config.accent,
                '--board-glow': config.glow,
              } as CSSProperties}
            >
              <span className={styles.heroIcon} aria-hidden>{config.icon}</span>
              <div>
                <p className={styles.heroBadge}>{config.subtitle}</p>
                <h1 className={styles.heroTitle}>{config.title}</h1>
                <p className={styles.heroDesc}>{config.description}</p>
              </div>
              <ButtonLink to={addListingPath(kind)} className={styles.cta}>
                + {config.addCta}
              </ButtonLink>
            </header>
          </Reveal>

          <Reveal delay={60}>
            <div className={styles.chips} role="tablist" aria-label="Категории">
              <button
                type="button"
                role="tab"
                aria-selected={!category}
                className={!category ? styles.chipActive : styles.chip}
                onClick={() => setCategory(null)}
              >
                Все
              </button>
              {config.categories.map((cat: BoardCategory) => (
                <button
                  key={cat.slug}
                  type="button"
                  role="tab"
                  aria-selected={category === cat.slug}
                  className={category === cat.slug ? styles.chipActive : styles.chip}
                  onClick={() => setCategory(cat.slug)}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <ListingSortControls
              activeSort={sortBy}
              options={SERVICE_SORT_OPTIONS}
              onSort={setSortBy}
            />
          </Reveal>

          {isLoading ? (
            <div className={tileGrid.grid}>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={pageStyles.empty}>
              <p className={pageStyles.emptyTitle}>Пока пусто</p>
              <p className={pageStyles.emptyHint}>
                Станьте первым —
                {' '}
                <Link to={addListingPath(kind)}>подать объявление</Link>
              </p>
            </div>
          ) : (
            <Reveal delay={100}>
              <div className={`${tileGrid.grid} motion-stagger`}>
                {filtered.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </Reveal>
          )}

          <p className={styles.footerLink}>
            <Link to={ROUTES.SERVICES}>Услуги мастеров →</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export {
  BoardKindPage,
};
