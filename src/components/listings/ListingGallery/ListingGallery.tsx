import { useState } from 'react';
import classNames from 'classnames';
import styles from './ListingGallery.module.css';

interface ListingGalleryProps {
  images: string[];
  title: string;
}

function ListingGallery({ images, title }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <section className={styles.gallery} aria-label="Фото работ и техники">
      <div className={styles.mainFrame}>
        <img
          className={styles.mainImage}
          src={activeImage}
          alt={`${title} — фото ${activeIndex + 1}`}
          loading="lazy"
        />
      </div>
      {images.length > 1 && (
        <div className={styles.thumbs}>
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              className={classNames(styles.thumbButton, index === activeIndex && styles.thumbActive)}
              onClick={() => setActiveIndex(index)}
              aria-label={`Показать фото ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <img className={styles.thumbImage} src={image} alt="" loading="lazy" />
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
