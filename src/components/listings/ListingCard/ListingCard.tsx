import { memo } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import type { Listing, ListingKind } from '@/types/listing';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { removeListingFromStore, updateListingInStore } from '@/features/listings/listingsSlice';
import { selectCanModerate, selectCurrentUser } from '@/features/user/userSelectors';
import { serviceDetailPath } from '@/constants';
import { FavoriteButton } from '@/components/listings/FavoriteButton/FavoriteButton';
import { ListingAuthorRow } from '@/components/listings/ListingAuthorRow/ListingAuthorRow';
import {
  ListingModerationActions,
  type ModerationAction,
} from '@/components/listings/ListingModerationActions/ListingModerationActions';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import { formatListingPrice } from '@/utils/listingPriceLabel';
import { getListingKindTheme, resolveListingKind } from '@/utils/listingKindTheme';
import { ListingSocialBar } from '@/components/listings/ListingSocialBar/ListingSocialBar';
import styles from './ListingCard.module.css';

interface ListingCardProps {
  listing: Listing;
  preview?: boolean;
  showFavorite?: boolean;
  variant?: 'default' | 'tile';
  onModerated?: (listingId: string, action: ModerationAction) => void;
}

const KIND_CARD_CLASS: Record<ListingKind, string> = {
  service: styles.cardKindService ?? '',
  sale: styles.cardKindSale ?? '',
  vacancy: styles.cardKindVacancy ?? '',
  lost: styles.cardKindLost ?? '',
};

const ListingCard = memo(function ListingCard({
  listing,
  preview = false,
  showFavorite = true,
  variant = 'default',
  onModerated,
}: ListingCardProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const canModerate = useAppSelector(selectCanModerate);
  const isOwner = currentUser?.id === listing.userId;
  const coverImage = listing.images[0];
  const isTile = variant === 'tile';
  const kind = resolveListingKind(listing.kind);
  const theme = getListingKindTheme(kind);
  const priceLabel = formatListingPrice(listing);

  const handleModerated = (action: ModerationAction) => {
    if (action === 'deleted' || action === 'rejected') {
      dispatch(removeListingFromStore(listing.id));
    }
    onModerated?.(listing.id, action);
  };

  const handleEdited = (updated: Listing) => {
    dispatch(updateListingInStore(updated));
  };

  const kindRibbon = (
    <span className={isTile ? styles.kindRibbonTile : styles.kindRibbon} aria-hidden>
      <span className={styles.kindRibbonIcon}>{theme.icon}</span>
      <span>{theme.shortLabel}</span>
    </span>
  );

  const mediaBlock = coverImage ? (
    <div className={isTile ? styles.mediaTile : styles.media}>
      {kindRibbon}
      {showFavorite && !preview && !canModerate && (
        <FavoriteButton listingId={listing.id} />
      )}
      <ListingPhoto
        className={isTile ? styles.coverTile : styles.cover}
        src={coverImage}
        alt=""
        loading="lazy"
      />
    </div>
  ) : (
    <div
      className={classNames(
        isTile ? styles.mediaTile : styles.media,
        styles.mediaPlaceholder,
      )}
    >
      {kindRibbon}
      <span className={styles.placeholderIcon} aria-hidden>
        {theme.icon}
      </span>
    </div>
  );

  const content = (
    <>
      {mediaBlock}

      <div className={isTile ? styles.bodyTile : styles.body}>
        {listing.author && !isTile && <ListingAuthorRow author={listing.author} compact />}

        <div className={styles.header}>
          <h3 className={isTile ? styles.titleTile : styles.title}>{listing.title}</h3>
          {listing.isVerified && !isTile && (
            <span className={styles.verified}>✓ Проверен</span>
          )}
        </div>

        {!isTile && <p className={styles.desc}>{listing.description}</p>}

        <div className={isTile ? styles.metaTile : styles.meta}>
          <span className={styles.price}>{priceLabel}</span>
          {!isOwner && (
            <span className={styles.rating}>★ {listing.rating.toFixed(1)}</span>
          )}
          {!isTile && !isOwner && <span>{listing.reviewsCount} отзывов</span>}
          {!isTile && <span>{listing.location.address}</span>}
        </div>

        {isTile && listing.author && (
          <ListingAuthorRow author={listing.author} compact />
        )}
      </div>
    </>
  );

  const cardClass = classNames(
    styles.card,
    KIND_CARD_CLASS[kind],
    isTile && styles.cardTile,
  );
  const linkClass = isTile ? `${styles.cardLink} ${styles.cardLinkTile}` : styles.cardLink;

  if (preview) {
    return (
      <article data-ui="card" data-listing-kind={kind} className={cardClass}>
        {content}
      </article>
    );
  }

  return (
    <article data-ui="card" data-listing-kind={kind} className={cardClass}>
      {canModerate && (
        <ListingModerationActions
          listingId={listing.id}
          listing={listing}
          listingTitle={listing.title}
          status={listing.status}
          variant="compact"
          onDone={handleModerated}
          onEdited={handleEdited}
        />
      )}
      <Link to={serviceDetailPath(listing.id)} className={linkClass}>
        {content}
      </Link>
      <div className={isTile ? styles.socialFootTile : styles.socialFoot}>
        <ListingSocialBar listing={listing} compact={isTile} />
      </div>
    </article>
  );
});

export {
  ListingCard,
};
