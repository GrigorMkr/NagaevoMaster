function isPdfAttachment(mimeType?: string, fileName?: string): boolean {
  if (mimeType === 'application/pdf') {
    return true;
  }
  return (fileName ?? '').toLowerCase().endsWith('.pdf');
}

function isOfficeAttachment(mimeType?: string, fileName?: string): boolean {
  const lower = (fileName ?? '').toLowerCase();
  if (/\.(docx?|xlsx?|pptx?|odt|ods|odp|rtf)$/i.test(lower)) {
    return true;
  }

  if (!mimeType) {
    return false;
  }

  return (
    mimeType.includes('officedocument')
    || mimeType.includes('msword')
    || mimeType.includes('ms-excel')
    || mimeType.includes('ms-powerpoint')
    || mimeType.includes('opendocument')
    || mimeType === 'application/rtf'
    || mimeType === 'text/rtf'
  );
}

function resolveOfficePreviewUrl(previewUrl: string): string {
  return `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(previewUrl)}`;
}

export {
  isOfficeAttachment,
  isPdfAttachment,
  resolveOfficePreviewUrl,
};
