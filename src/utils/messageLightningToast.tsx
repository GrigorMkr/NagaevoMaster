import toast from 'react-hot-toast';
import styles from './messageLightningToast.module.css';

function showMessageLightning(senderName: string, preview: string) {
  toast.custom(
    (t) => (
      <div
        className={`${styles.root} ${t.visible ? styles.visible : styles.hidden}`}
        role="status"
        aria-live="polite"
      >
        <span className={styles.bolt} aria-hidden>⚡</span>
        <div className={styles.body}>
          <strong className={styles.title}>{senderName}</strong>
          <p className={styles.preview}>{preview}</p>
        </div>
      </div>
    ),
    {
      id: 'message-lightning',
      duration: 2800,
      position: 'top-center',
    },
  );
}

export {
  showMessageLightning,
};
