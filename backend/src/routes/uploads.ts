import path from 'node:path';
import fs from 'node:fs';
import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { assertSafeUploadFilename } from '../utils/uploadSafety.js';

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

const MESSAGE_DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

function isMessageMimeAllowed(mime: string) {
  return (mime.startsWith('image/') && mime !== 'image/svg+xml')
    || mime.startsWith('audio/')
    || MESSAGE_DOC_MIMES.has(mime);
}

const messageUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!isMessageMimeAllowed(file.mimetype)) {
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
    const url = `${env.PUBLIC_UPLOAD_URL}/${req.file.filename}`;
    const kind = req.file.mimetype.startsWith('audio/') ? 'voice' : 'file';
    res.status(201).json({
      id: req.file.filename,
      url,
      mimeType: req.file.mimetype,
      name: req.file.originalname,
      kind,
    });
  } catch (error) {
    next(error);
  }
});

export {
  uploadsRouter,
};
