function ensureHttpsUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://')) {
    return `https://${url.slice(7)}`;
  }
  return url;
}

export {
  ensureHttpsUrl,
};
