import path from 'node:path';
import fs from 'node:fs';
import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { assertSafeUploadFilename } from '../utils/uploadSafety.js';
import { isMessageAttachmentAllowed, MESSAGE_UPLOAD_MAX_BYTES } from '../utils/messageAttachmentTypes.js';
import {
  decodeMultipartFilename,
  normalizeUploadedTextFile,
  shouldNormalizeTextFile,
  textMimeTypeForExtension,
} from '../utils/textEncoding.js';

const uploadsRouter = Router();

if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext && /^\.[a-z0-9]+$/.test(ext) ? ext : '';
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    try {
      assertSafeUploadFilename(file.originalname, file.mimetype, 'image');
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  },
});

const messageUpload = multer({
  storage,
  limits: { fileSize: MESSAGE_UPLOAD_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isMessageAttachmentAllowed(file.mimetype, file.originalname)) {
      cb(new HttpError(400, 'Недопустимый тип файла для переписки'));
      return;
    }
    if (file.mimetype.startsWith('image/')) {
      try {
        assertSafeUploadFilename(file.originalname, file.mimetype, 'image');
      } catch (error) {
        cb(error as Error);
        return;
      }
    }
    cb(null, true);
  },
});

uploadsRouter.post('/', requireAuth, imageUpload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, 'Файл не передан');
    }
    const url = `${env.PUBLIC_UPLOAD_URL}/${req.file.filename}`;
    res.status(201).json({ id: req.file.filename, url });
  } catch (error) {
    next(error);
  }
});

uploadsRouter.post('/message', requireAuth, messageUpload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, 'Файл не передан');
    }

    const originalName = decodeMultipartFilename(req.file.originalname);
    const savedSize = fs.statSync(req.file.path).size;
    if (savedSize === 0) {
      fs.unlinkSync(req.file.path);
      throw new HttpError(400, 'Файл не получен сервером. Повторите отправку.');
    }

    if (shouldNormalizeTextFile(originalName)) {
      normalizeUploadedTextFile(req.file.path);
      if (fs.statSync(req.file.path).size === 0) {
        fs.unlinkSync(req.file.path);
        throw new HttpError(400, 'Не удалось обработать текстовый файл');
      }
    }

    const textMime = textMimeTypeForExtension(originalName);
    const mimeType = textMime ?? req.file.mimetype;
    const url = `${env.PUBLIC_UPLOAD_URL}/${req.file.filename}`;
    const kind = mimeType.startsWith('audio/') ? 'voice' : 'file';
    res.status(201).json({
      id: req.file.filename,
      url,
      mimeType,
      name: originalName,
      kind,
    });
  } catch (error) {
    next(error);
  }
});

uploadsRouter.get('/download/:filename', (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename ?? '');
    if (!filename || filename.includes('..')) {
      throw new HttpError(400, 'Некорректное имя файла');
    }

    const filePath = path.join(env.UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new HttpError(404, 'Файл не найден');
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new HttpError(404, 'Пустой файл');
    }

    const requestedName = typeof req.query.name === 'string'
      ? decodeMultipartFilename(req.query.name)
      : filename;
    const downloadName = path.basename(requestedName) || filename;

    res.download(filePath, downloadName);
  } catch (error) {
    next(error);
  }
});

export {
  uploadsRouter,
};
