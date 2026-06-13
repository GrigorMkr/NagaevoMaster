function buildAvatarUrl(name: string, seed?: string): string {
  const label = encodeURIComponent(name.trim() || 'Мастер');
  const background = '17624a';
  const color = 'ffffff';
  const size = 128;

  if (seed) {
    return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${background}`;
  }

  return `https://ui-avatars.com/api/?name=${label}&background=${background}&color=${color}&size=${size}&bold=true`;
}

export {
  buildAvatarUrl,
}
