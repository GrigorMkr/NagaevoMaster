import { useEffect, useMemo, useState } from 'react';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import {
  isOfficeAttachment,
  isPdfAttachment,
  resolveOfficePreviewUrl,
} from '@/utils/documentAttachment';
import styles from './DocumentAttachmentPreview.module.css';

interface DocumentAttachmentPreviewProps {
  src: string;
  fileName: string;
  mimeType?: string;
}

function PdfBlobPreview({ src, fileName }: { src: string; fileName: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    let revokeTimer: number | undefined;

    void (async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength === 0) {
          throw new Error('empty pdf');
        }

        objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setBlobUrl(objectUrl);
        revokeTimer = window.setTimeout(() => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
        }, 60_000);
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (revokeTimer) {
        window.clearTimeout(revokeTimer);
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (failed) {
    return (
      <div className={styles.fallback}>
        <ToolbarIcon name="paperclip" accent="var(--color-primary)" motion="float" />
        <p className={styles.fallbackName}>{fileName}</p>
        <p className={styles.fallbackHint}>
          Не удалось открыть PDF. Скачайте файл через меню ⋮.
        </p>
      </div>
    );
  }

  if (!blobUrl) {
    return <p className={styles.loading}>Загрузка PDF…</p>;
  }

  return (
    <iframe
      className={styles.frame}
      src={blobUrl}
      title={fileName}
    />
  );
}

function DocumentAttachmentPreview({ src, fileName, mimeType }: DocumentAttachmentPreviewProps) {
  const isPdf = isPdfAttachment(mimeType, fileName);
  const officePreviewUrl = useMemo(
    () => (isOfficeAttachment(mimeType, fileName) ? resolveOfficePreviewUrl(src) : null),
    [fileName, mimeType, src],
  );

  if (isPdf) {
    return (
      <div className={styles.wrap}>
        <PdfBlobPreview src={src} fileName={fileName} />
      </div>
    );
  }

  if (!officePreviewUrl) {
    return (
      <div className={styles.fallback}>
        <ToolbarIcon name="paperclip" accent="var(--color-primary)" motion="float" />
        <p className={styles.fallbackName}>{fileName}</p>
        {mimeType && <p className={styles.fallbackHint}>{mimeType}</p>}
        <p className={styles.fallbackHint}>
          Предпросмотр недоступен. Скачайте файл через меню ⋮.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <iframe
        className={styles.frame}
        src={officePreviewUrl}
        title={fileName}
      />
      <p className={styles.officeHint}>
        Если документ не отображается, скачайте его через меню ⋮.
      </p>
    </div>
  );
}

export {
  DocumentAttachmentPreview,
};
