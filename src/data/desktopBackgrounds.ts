import { publicUrl } from '@/utils/publicUrl';

const DESKTOP_BACKGROUND_INTERVAL_MS = 20 * 60 * 1000;

const DESKTOP_BACKGROUNDS = [
  {
    src: publicUrl('/backgrounds/desktop-red-lake.jpg'),
    position: 'center 42%',
  },
] as const;

export {
  DESKTOP_BACKGROUNDS,
  DESKTOP_BACKGROUND_INTERVAL_MS,
};
