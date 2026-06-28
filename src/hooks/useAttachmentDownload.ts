import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { resolveAttachmentDownloadUrl } from '@/utils/attachmentDownloadUrl';
import { downloadAttachment } from '@/utils/downloadAttachment';
import { getErrorMessage } from '@/utils/errorMessage';

function useAttachmentDownload(uploadPath: string, fileName: string) {
  const [busy, setBusy] = useState(false);

  const download = useCallback(async () => {
    if (busy || !uploadPath) {
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
  }, [busy, fileName, uploadPath]);

  return { download, busy };
}

export {
  useAttachmentDownload,
};
