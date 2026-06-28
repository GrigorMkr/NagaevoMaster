import { resolveAbsoluteApiBase } from '@/utils/apiBase';

function extractUploadFilename(uploadPath: string): string | null {
  const trimmed = uploadPath.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const pathname = trimmed.startsWith('http')
      ? new URL(trimmed).pathname
      : trimmed;
    const base = pathname.split('/').pop();
    return base && !base.includes('..') ? base : null;
  } catch {
    const base = trimmed.split('/').pop();
    return base && !base.includes('..') ? base : null;
  }
}

function resolveAttachmentDownloadUrl(uploadPath: string, fileName: string): string {
  const filename = extractUploadFilename(uploadPath);
  if (!filename) {
    return uploadPath;
  }

  const apiBase = resolveAbsoluteApiBase();
  const params = new URLSearchParams({ name: fileName });
  return `${apiBase}/uploads/download/${encodeURIComponent(filename)}?${params.toString()}`;
}

export {
  extractUploadFilename,
  resolveAttachmentDownloadUrl,
};
