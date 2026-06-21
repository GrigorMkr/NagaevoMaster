import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '@/types/listing';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { removeListingFromStore } from '@/features/listings/listingsSlice';
import { selectCanModerate, selectCurrentUser } from '@/features/user/userSelectors';
import { serviceDetailPath } from '@/constants';
import { FavoriteButton } from '@/components/listings/FavoriteButton/FavoriteButton';
import { ListingAuthorRow } from '@/components/listings/ListingAuthorRow/ListingAuthorRow';
import {
  ListingModerationActions,
  type ModerationAction,
} from '@/components/listings/ListingModerationActions/ListingModerationActions';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import styles from './ListingCard.module.css';

interface ListingCardProps {
  listing: Listing;
  preview?: boolean;
  showFavorite?: boolean;
  variant?: 'default' | 'tile';
  onModerated?: (listingId: string, action: ModerationAction) => void;
}

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

  const handleModerated = (action: ModerationAction) => {
    if (action === 'deleted' || action === 'rejected') {
      dispatch(removeListingFromStore(listing.id));
    }
    onModerated?.(listing.id, action);
  };

  const content = (
    <>
      {coverImage && (
        <div className={isTile ? styles.mediaTile : styles.media}>
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
      )}

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
          <span className={styles.price}>
            от {listing.priceFrom} ₽ / {listing.unit}
          </span>
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

  const cardClass = isTile ? `${styles.card} ${styles.cardTile}` : styles.card;
  const linkClass = isTile ? `${styles.cardLink} ${styles.cardLinkTile}` : styles.cardLink;

  if (preview) {
    return (
      <article data-ui="card" className={cardClass}>
        {content}
      </article>
    );
  }

  return (
    <article data-ui="card" className={cardClass}>
      {canModerate && (
        <ListingModerationActions
          listingId={listing.id}
          listingTitle={listing.title}
          status={listing.status}
          variant="compact"
          onDone={handleModerated}
        />
      )}
      <Link to={serviceDetailPath(listing.id)} className={linkClass}>
        {content}
      </Link>
    </article>
  );
});

export {
  ListingCard,
};
