import path from 'node:path';
import type { Response } from 'express';
import { uploadContentTypeForPath } from './textEncoding.js';

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.rtf': 'application/rtf',
};

const DOWNLOAD_EXTENSIONS = new Set([
  ...Object.keys(MIME_BY_EXT),
  '.txt',
  '.md',
  '.csv',
]);

function applyUploadStaticHeaders(res: Response, filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = uploadContentTypeForPath(filePath) ?? MIME_BY_EXT[ext];

  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }

  if (DOWNLOAD_EXTENSIONS.has(ext)) {
    const filename = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
}

export {
  applyUploadStaticHeaders,
};
