import { useState } from 'react';
import classNames from 'classnames';
import { ListingPhoto } from '@/components/ui/ListingPhoto/ListingPhoto';
import styles from './ListingGallery.module.css';

interface ListingGalleryProps {
  images: string[];
  title: string;
  variant?: 'default' | 'compact';
}

function ListingGallery({ images, title, variant = 'default' }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isCompact = variant === 'compact';

  if (images.length === 0) {
    return null;
  }

  const activeImage = images[activeIndex] ?? images[0]!;

  return (
    <section
      className={isCompact ? styles.galleryCompact : styles.gallery}
      aria-label="Фото работ и техники"
    >
      <div className={isCompact ? styles.mainFrameCompact : styles.mainFrame}>
        <ListingPhoto
          className={isCompact ? styles.mainImageCompact : styles.mainImage}
          src={activeImage}
          alt={`${title} — фото ${activeIndex + 1}`}
          loading="lazy"
        />
      </div>
      {images.length > 1 && (
        <div className={isCompact ? styles.thumbsCompact : styles.thumbs}>
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              className={classNames(styles.thumbButton, index === activeIndex && styles.thumbActive)}
              onClick={() => setActiveIndex(index)}
              aria-label={`Показать фото ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <ListingPhoto
                className={isCompact ? styles.thumbImageCompact : styles.thumbImage}
                src={image}
                alt=""
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export {
  ListingGallery,
}
