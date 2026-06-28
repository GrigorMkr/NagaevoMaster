import { useState, type MouseEvent } from 'react';
import toast from 'react-hot-toast';
import { ToolbarIcon } from '@/components/ui/ToolbarIcon';
import { downloadAttachment } from '@/utils/downloadAttachment';
import { resolveAttachmentDownloadUrl } from '@/utils/attachmentDownloadUrl';
import { getErrorMessage } from '@/utils/errorMessage';
import styles from './AttachmentDownloadButton.module.css';

interface AttachmentDownloadButtonProps {
  uploadPath: string;
  fileName: string;
  label?: string;
}

function AttachmentDownloadButton({
  uploadPath,
  fileName,
  label = 'Скачать файл',
}: AttachmentDownloadButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      const downloadUrl = resolveAttachmentDownloadUrl(uploadPath, fileName);
      await downloadAttachment(downloadUrl, fileName);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось скачать файл'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.button}
      onClick={(event) => void handleClick(event)}
      disabled={busy}
    >
      <ToolbarIcon name="paperclip" accent="var(--color-mint)" motion="float" />
      <span>{busy ? 'Скачивание…' : label}</span>
    </button>
  );
}

export {
  AttachmentDownloadButton,
};
