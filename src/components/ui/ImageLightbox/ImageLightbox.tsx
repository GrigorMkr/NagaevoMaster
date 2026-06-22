import styles from './ImageLightbox.module.css';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
        ×
      </button>
      <img
        className={styles.image}
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

export {
  ImageLightbox,
};
