function buildAvatarUrl(name: string, seed?: string): string {
  const label = name.trim() || 'Мастер';
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'Н';

  const hash = Array.from(seed ?? label).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const hue = 140 + (hash % 40);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue} 58% 28%)"/>
      <stop offset="100%" stop-color="hsl(${hue + 18} 62% 38%)"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="64" fill="url(#g)"/>
  <text x="64" y="74" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff">${initials}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export {
  buildAvatarUrl,
}
