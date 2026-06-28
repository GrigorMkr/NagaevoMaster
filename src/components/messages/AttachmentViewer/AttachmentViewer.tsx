import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AttachmentOverflowMenu } from '@/components/messages/AttachmentOverflowMenu/AttachmentOverflowMenu';
import { DocumentAttachmentPreview } from '@/components/messages/DocumentAttachmentPreview/DocumentAttachmentPreview';
import { TextAttachmentPreview } from '@/components/messages/TextAttachmentPreview/TextAttachmentPreview';
import { VoiceMessagePlayer } from '@/components/messages/VoiceMessagePlayer/VoiceMessagePlayer';
import styles from './AttachmentViewer.module.css';

type AttachmentViewerKind = 'image' | 'video' | 'text' | 'file' | 'voice';

interface AttachmentViewerProps {
  kind: AttachmentViewerKind;
  previewUrl: string;
  uploadPath: string;
  fileName: string;
  mimeType?: string;
  canForward?: boolean;
  canDelete?: boolean;
  onForward?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

function AttachmentViewer({
  kind,
  previewUrl,
  uploadPath,
  fileName,
  mimeType,
  canForward = false,
  canDelete = false,
  onForward,
  onDelete,
  onClose,
}: AttachmentViewerProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const handleDelete = async () => {
    await onDelete?.();
    onClose();
  };

  const overlay = (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={fileName}>
      <div
        className={styles.toolbar}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <p className={styles.fileName}>{fileName}</p>
        <div className={styles.toolbarActions}>
          <AttachmentOverflowMenu
            uploadPath={uploadPath}
            fileName={fileName}
            tone="dark"
            canForward={canForward}
            canDelete={canDelete}
            onForward={onForward}
            onDelete={() => void handleDelete()}
          />
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
      </div>

      <div className={styles.content} onClick={onClose}>
        {kind === 'image' && (
          <img
            className={styles.image}
            src={previewUrl}
            alt={fileName}
            onClick={(event) => event.stopPropagation()}
          />
        )}

        {kind === 'video' && (
          <video
            className={styles.video}
            src={previewUrl}
            controls
            autoPlay
            preload="metadata"
            onClick={(event) => event.stopPropagation()}
          />
        )}

        {kind === 'text' && (
          <div className={styles.textWrap} onClick={(event) => event.stopPropagation()}>
            <TextAttachmentPreview src={previewUrl} fileName={fileName} />
          </div>
        )}

        {kind === 'file' && (
          <div className={styles.documentWrap} onClick={(event) => event.stopPropagation()}>
            <DocumentAttachmentPreview src={previewUrl} fileName={fileName} mimeType={mimeType} />
          </div>
        )}

        {kind === 'voice' && (
          <div className={styles.voiceWrap} onClick={(event) => event.stopPropagation()}>
            <VoiceMessagePlayer src={previewUrl} />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export {
  AttachmentViewer,
};

export type {
  AttachmentViewerKind,
};
