import path from 'node:path';
import { HttpError } from '../middleware/errorHandler.js';

const BLOCKED_EXTENSIONS = new Set([
  '.html', '.htm', '.svg', '.xml', '.js', '.mjs', '.cjs',
  '.php', '.phtml', '.asp', '.aspx', '.jsp', '.exe', '.bat', '.sh', '.cmd',
]);

const BLOCKED_IMAGE_MIMES = new Set([
  'image/svg+xml',
  'text/html',
  'application/javascript',
  'text/javascript',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif',
]);

function assertSafeUploadFilename(originalname: string, mimetype: string, mode: 'image' | 'message') {
  const ext = path.extname(originalname).toLowerCase();

  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new HttpError(400, 'Недопустимый тип файла');
  }

  if (mode === 'image') {
    if (BLOCKED_IMAGE_MIMES.has(mimetype)) {
      throw new HttpError(400, 'Недопустимый тип изображения');
    }
    if (!mimetype.startsWith('image/')) {
      throw new HttpError(400, 'Можно загружать только изображения');
    }
    if (ext && !ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
      throw new HttpError(400, 'Разрешены только JPG, PNG, GIF, WEBP');
    }
  }
}

export {
  assertSafeUploadFilename,
};
