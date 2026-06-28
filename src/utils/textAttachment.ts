const TEXT_ATTACHMENT_PATTERN = /\.(txt|md|csv)$/i;

function isTextAttachment(mimeType?: string, fileName?: string): boolean {
  if (mimeType?.startsWith('text/')) {
    return true;
  }
  return TEXT_ATTACHMENT_PATTERN.test(fileName ?? '');
}

export {
  isTextAttachment,
};
