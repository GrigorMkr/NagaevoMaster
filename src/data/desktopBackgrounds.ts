const DESKTOP_BACKGROUND_INTERVAL_MS = 20 * 60 * 1000;

/**
 * Use BASE_URL concat (not a shared helper) so Rolldown cannot remap the path
 * through a colliding minified binding in the main chunk.
 */
const DESKTOP_BACKGROUNDS = [
  {
    src: `${import.meta.env.BASE_URL}backgrounds/desktop-red-lake.jpg`,
    position: 'center 42%',
  },
] as const;

export {
  DESKTOP_BACKGROUNDS,
  DESKTOP_BACKGROUND_INTERVAL_MS,
};
