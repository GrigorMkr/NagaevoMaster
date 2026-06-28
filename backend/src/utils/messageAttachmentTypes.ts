import path from 'node:path';

const MESSAGE_DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/rtf',
  'text/rtf',
  'text/plain',
  'text/csv',
  'application/csv',
  'text/markdown',
]);

const MESSAGE_VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.mkv', '.m4v', '.avi', '.3gp']);
const MESSAGE_AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.ogg', '.opus', '.wav', '.aac', '.webm']);
const MESSAGE_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.heic', '.heif']);
const MESSAGE_DOC_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  '.rtf',
  '.txt',
  '.csv',
  '.md',
]);

const MESSAGE_UPLOAD_MAX_BYTES = 100 * 1024 * 1024;

function isMessageAttachmentAllowed(mime: string, originalname: string) {
  const ext = path.extname(originalname).toLowerCase();

  if ((mime.startsWith('image/') && mime !== 'image/svg+xml')
    || mime.startsWith('video/')
    || mime.startsWith('audio/')
    || MESSAGE_DOC_MIMES.has(mime)) {
    return true;
  }

  if (
    mime === 'application/octet-stream'
    || mime === 'application/x-matroska'
    || !mime
  ) {
    return MESSAGE_VIDEO_EXTENSIONS.has(ext)
      || MESSAGE_AUDIO_EXTENSIONS.has(ext)
      || MESSAGE_IMAGE_EXTENSIONS.has(ext)
      || MESSAGE_DOC_EXTENSIONS.has(ext);
  }

  return false;
}

export {
  MESSAGE_UPLOAD_MAX_BYTES,
  isMessageAttachmentAllowed,
};
