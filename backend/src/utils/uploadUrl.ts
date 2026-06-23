import { HttpError } from '../middleware/errorHandler.js';

function uploadPathFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) return trimmed;
  try {
    return new URL(trimmed).pathname;
  } catch {
    return null;
  }
}

function assertOwnedUpload(url: string) {
  const path = uploadPathFromUrl(url);
  if (!path?.startsWith('/uploads/')) {
    throw new HttpError(400, 'Некорректная ссылка на вложение');
  }
}

export {
  assertOwnedUpload,
  uploadPathFromUrl,
};
