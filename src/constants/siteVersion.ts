import siteVersion from '@/data/siteVersion.json';

const SITE_VERSION = siteVersion.version;
const SITE_UPDATED_AT = siteVersion.updatedAt;

function formatSiteUpdatedAt(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

const SITE_UPDATED_LABEL = formatSiteUpdatedAt(SITE_UPDATED_AT);

export {
  SITE_VERSION,
  SITE_UPDATED_AT,
  SITE_UPDATED_LABEL,
  formatSiteUpdatedAt,
};
