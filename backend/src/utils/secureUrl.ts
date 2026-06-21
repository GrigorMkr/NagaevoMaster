function ensureHttpsUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://')) {
    return `https://${url.slice(7)}`;
  }
  return url;
}

function upgradeInsecureHttpInText(text: string): string {
  return text.replace(/http:\/\//gi, 'https://');
}

export {
  ensureHttpsUrl,
  upgradeInsecureHttpInText,
};
