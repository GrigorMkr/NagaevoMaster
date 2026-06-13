const FEATURE_IMAGE_BASE = `${import.meta.env.BASE_URL || '/'}`.replace(/\/$/, '') + '/features';

function featureImage(name: string): string {
  return `${FEATURE_IMAGE_BASE}/${name}`.replace(/\/{2,}/g, '/');
}

const HOME_FEATURE_IMAGES = {
  localSearch: featureImage('local-search.png'),
  verifiedMasters: featureImage('verified-masters.png'),
  forumSettlement: featureImage('forum-settlement.png'),
} as const;

export {
  HOME_FEATURE_IMAGES,
};
