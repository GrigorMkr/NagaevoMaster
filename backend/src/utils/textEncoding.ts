import fs from 'node:fs';
import path from 'node:path';

const TEXT_NORMALIZE_EXTENSIONS = new Set(['.txt', '.md', '.csv']);

function decodeMultipartFilename(name: string): string {
  if (!name) {
    return name;
  }

  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  if (decoded !== name && /[\u0400-\u04FF]/.test(decoded)) {
    return decoded;
  }

  return name;
}

function isValidUtf8(buffer: Buffer): boolean {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return true;
  }

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

function decodeTextBuffer(buffer: Buffer): string {
  if (isValidUtf8(buffer)) {
    return buffer.toString('utf8');
  }

  try {
    return new TextDecoder('windows-1251').decode(buffer);
  } catch {
    return buffer.toString('utf8');
  }
}

function shouldNormalizeTextFile(originalname: string): boolean {
  return TEXT_NORMALIZE_EXTENSIONS.has(path.extname(originalname).toLowerCase());
}

function normalizeUploadedTextFile(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length === 0) {
    return;
  }
  const text = decodeTextBuffer(buffer);
  fs.writeFileSync(filePath, text, 'utf8');
}

function textMimeTypeForExtension(originalname: string): string | null {
  const ext = path.extname(originalname).toLowerCase();
  if (ext === '.csv') {
    return 'text/csv; charset=utf-8';
  }
  if (TEXT_NORMALIZE_EXTENSIONS.has(ext)) {
    return 'text/plain; charset=utf-8';
  }
  return null;
}

function uploadContentTypeForPath(filePath: string): string | undefined {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    return 'text/csv; charset=utf-8';
  }
  if (TEXT_NORMALIZE_EXTENSIONS.has(ext)) {
    return 'text/plain; charset=utf-8';
  }
  if (ext === '.md') {
    return 'text/markdown; charset=utf-8';
  }
  return undefined;
}

export {
  decodeMultipartFilename,
  normalizeUploadedTextFile,
  shouldNormalizeTextFile,
  textMimeTypeForExtension,
  uploadContentTypeForPath,
};
