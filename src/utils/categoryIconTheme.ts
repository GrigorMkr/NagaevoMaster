const CATEGORY_ICON_ACCENTS: Record<string, string> = {
  construction: '#7ec8a8',
  machinery: '#e8b84a',
  utility: '#5eb8ff',
  staff: '#f08a7e',
  logistics: '#9ed4ff',
  farming: '#c8e86a',
  pro: '#b8a0ff',
  sales: '#f0c14b',
  beauty: '#ff9acb',
  plumbing: '#5eb8ff',
  electric: '#ffe082',
  septic: '#94b8ff',
  cleaning: '#7ec8a8',
  general: '#5eb8ff',
  other: '#a0b8c8',
};

function getCategoryIconAccent(slug: string): string {
  return CATEGORY_ICON_ACCENTS[slug] ?? '#7ec8a8';
}

export {
  CATEGORY_ICON_ACCENTS,
  getCategoryIconAccent,
};
