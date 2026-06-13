import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '@/types/listing';
import { serviceDetailPath } from '@/constants';
import { ListingAuthorRow } from '@/components/listings/ListingAuthorRow/ListingAuthorRow';
import styles from './ListingCard.module.css';

interface ListingCardProps {
  listing: Listing;
}

const ListingCard = memo(function ListingCard({ listing }: ListingCardProps) {
  const coverImage = listing.images[0];

  return (
    <Link to={serviceDetailPath(listing.id)} data-ui="card" className={styles.card}>
      {coverImage && (
        <div className={styles.media}>
          <img className={styles.cover} src={coverImage} alt="" loading="lazy" />
        </div>
      )}

      <div className={styles.body}>
        {listing.author && <ListingAuthorRow author={listing.author} compact />}

        <div className={styles.header}>
          <h3 className={styles.title}>{listing.title}</h3>
          {listing.isVerified && <span className={styles.verified}>✓ Проверен</span>}
        </div>

        <p className={styles.desc}>{listing.description}</p>

        <div className={styles.meta}>
          <span className={styles.price}>
            от {listing.priceFrom} ₽ / {listing.unit}
          </span>
          <span className={styles.rating}>★ {listing.rating.toFixed(1)}</span>
          <span>{listing.reviewsCount} отзывов</span>
          <span>{listing.location.address}</span>
        </div>
      </div>
    </Link>
  );
});

export {
  ListingCard,
}
