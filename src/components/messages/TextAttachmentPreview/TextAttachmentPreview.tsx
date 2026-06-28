import { useEffect, useState } from 'react';
import styles from './TextAttachmentPreview.module.css';

const MAX_PREVIEW_BYTES = 100_000;

interface TextAttachmentPreviewProps {
  src: string;
  fileName?: string;
}

function TextAttachmentPreview({ src, fileName }: TextAttachmentPreviewProps) {
  const [text, setText] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setText(null);
    setTruncated(false);
    setFailed(false);

    void (async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error('load failed');
        }
        const body = await response.text();
        if (cancelled) {
          return;
        }
        if (body.length > MAX_PREVIEW_BYTES) {
          setText(body.slice(0, MAX_PREVIEW_BYTES));
          setTruncated(true);
          return;
        }
        setText(body);
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (failed) {
    return null;
  }

  if (text === null) {
    return <p className={styles.loading}>Загрузка текста…</p>;
  }

  return (
    <div className={styles.wrap}>
      {fileName && <p className={styles.fileName}>{fileName}</p>}
      <pre className={styles.content}>{text}</pre>
      {truncated && <p className={styles.note}>Показана часть файла. Откройте файл полностью, чтобы увидеть всё содержимое.</p>}
    </div>
  );
}

export {
  TextAttachmentPreview,
};
