function sanitizeDownloadName(fileName: string): string {
  const trimmed = fileName.trim().replace(/[/\\?%*:|"<>]/g, '_');
  return trimmed || 'download';
}

async function downloadAttachment(url: string, fileName: string): Promise<void> {
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Пустой файл на сервере');
  }

  const safeName = sanitizeDownloadName(fileName);
  const objectUrl = URL.createObjectURL(new Blob([buffer], {
    type: response.headers.get('content-type') ?? 'application/octet-stream',
  }));

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = safeName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export {
  downloadAttachment,
  sanitizeDownloadName,
};
