import type { CSSProperties } from 'react';
import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '@/types/listing';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import { RichIcon } from '@/components/ui/RichIcon';
import { serviceDetailPath } from '@/constants';
import { formatListingPrice } from '@/utils/listingPriceLabel';
import { getListingKindTheme, resolveListingKind } from '@/utils/listingKindTheme';
import styles from './BoardListingCard.module.css';

interface BoardListingCardProps {
  listing: Listing;
}

const BoardListingCard = memo(function BoardListingCard({ listing }: BoardListingCardProps) {
  const kind = resolveListingKind(listing.kind);
  const theme = getListingKindTheme(kind);
  const coverImage = listing.images[0];
  const priceLabel = formatListingPrice(listing);

  return (
    <article
      data-ui="card"
      data-listing-kind={kind}
      className={styles.card}
      style={{
        '--board-kind-accent': theme.accent,
        '--board-kind-accent2': theme.accent2,
        '--board-kind-glow': `color-mix(in srgb, ${theme.accent} 35%, transparent)`,
      } as CSSProperties}
    >
      <Link to={serviceDetailPath(listing.id)} className={styles.link}>
        <div className={styles.media}>
          {coverImage ? (
            <ListingPhoto src={coverImage} alt="" className={styles.photo} loading="lazy" />
          ) : (
            <div className={styles.placeholder}>
              <RichIcon
                name={theme.icon}
                variant="inline"
                size="lg"
                accent={theme.accent}
                accent2={theme.accent2}
                motion="none"
              />
            </div>
          )}
          <span className={styles.mediaScrim} aria-hidden />
          <span className={styles.kind}>{theme.shortLabel}</span>
        </div>

        <div className={styles.body}>
          <h3 className={styles.title}>{listing.title}</h3>
          <p className={styles.price}>{priceLabel}</p>
        </div>
      </Link>
    </article>
  );
});

export {
  BoardListingCard,
};
