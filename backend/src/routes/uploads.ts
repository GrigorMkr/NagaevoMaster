import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { env } from '../config/env.js'
import { requireAuth } from '../middleware/auth.js'
import { HttpError } from '../middleware/errorHandler.js'

export const uploadsRouter = Router()

if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new HttpError(400, 'Можно загружать только изображения'))
      return
    }
    cb(null, true)
  },
})

uploadsRouter.post('/', requireAuth, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, 'Файл не передан')
    }

    const url = `${env.PUBLIC_UPLOAD_URL}/${req.file.filename}`
    res.status(201).json({ id: req.file.filename, url })
  } catch (error) {
    next(error)
  }
})
