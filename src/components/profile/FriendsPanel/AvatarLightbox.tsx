import styles from './AvatarLightbox.module.css';

interface AvatarLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function AvatarLightbox({ src, alt, onClose }: AvatarLightboxProps) {
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
  AvatarLightbox,
};
