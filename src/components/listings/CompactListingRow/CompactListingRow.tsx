import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ListingStatusBadge } from '@/components/listings/ListingStatusBadge/ListingStatusBadge';
import { ListingAuthorRow } from '@/components/listings/ListingAuthorRow/ListingAuthorRow';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import { RichIcon } from '@/components/ui/RichIcon';
import type { Listing } from '@/types/listing';
import { getListingKindTheme, resolveListingKind } from '@/utils/listingKindTheme';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import styles from './CompactListingRow.module.css';

interface CompactListingRowProps {
  listing: Listing;
  to?: string;
  onClick?: () => void;
  showStatus?: boolean;
  showAuthor?: boolean;
  showArrow?: boolean;
}

const CompactListingRow = memo(function CompactListingRow({
  listing,
  to,
  onClick,
  showStatus = true,
  showAuthor = true,
  showArrow = true,
}: CompactListingRowProps) {
  const kindTheme = getListingKindTheme(resolveListingKind(listing.kind));

  const content = (
    <>
      <div className={styles.thumb}>
        {listing.images[0] ? (
          <ListingPhoto src={listing.images[0]} alt="" className={styles.thumbImage} />
        ) : (
          <RichIcon
            name={kindTheme.icon}
            variant="gem"
            size="md"
            accent={kindTheme.accent}
            accent2={kindTheme.accent2}
            motion="float"
            className={styles.thumbIcon}
          />
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.top}>
          {showStatus && <ListingStatusBadge status={listing.status} />}
        </div>
        <p className={styles.title}>{listing.title}</p>
        <p className={styles.meta}>
          от {listing.priceFrom} ₽ / {listing.unit}
        </p>
        {showAuthor && listing.author && (
          <div className={styles.author}>
            <ListingAuthorRow author={listing.author} compact />
          </div>
        )}
      </div>
      {showArrow && (
        <span className={styles.arrow} aria-hidden>
          <ToolbarIcon name="chevronRight" accent="#7ec8a8" motion="pulse" />
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} data-ui="card" className={styles.row} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" data-ui="card" className={styles.row} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={`${styles.row} ${styles.rowStatic}`}>{content}</div>;
});

export {
  CompactListingRow,
};
