const ABOUT_IMAGE_BASE = `${import.meta.env.BASE_URL || '/'}`.replace(/\/$/, '') + '/about-images';

function aboutImage(name: string): string {
  return `${ABOUT_IMAGE_BASE}/${name}`.replace(/\/{2,}/g, '/');
}

const ABOUT_IMAGES = {
  audience: aboutImage('audience.png'),
  geography: aboutImage('geography.png'),
  mission: aboutImage('mission.png'),
  rules: aboutImage('rules.png'),
  moderation: aboutImage('moderation.png'),
} as const;

export {
  ABOUT_IMAGES,
};
