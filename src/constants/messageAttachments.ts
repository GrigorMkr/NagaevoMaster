/** Вложения в чат: лимит и типы файлов (синхронизировать с backend/src/utils/messageAttachmentTypes.ts) */

const MESSAGE_ATTACHMENT_MAX_BYTES = 100 * 1024 * 1024;
const MESSAGE_ATTACHMENT_MAX_MB = 100;

const MESSAGE_ATTACHMENT_ACCEPT = [
  'image/*',
  'video/*',
  'audio/*',
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
].join(',');

const MESSAGE_ATTACHMENT_HINT = `Фото, видео, PDF, Word, Excel, PowerPoint, ODT/ODS и др. (до ${MESSAGE_ATTACHMENT_MAX_MB} МБ)`;

export {
  MESSAGE_ATTACHMENT_ACCEPT,
  MESSAGE_ATTACHMENT_HINT,
  MESSAGE_ATTACHMENT_MAX_BYTES,
  MESSAGE_ATTACHMENT_MAX_MB,
};
