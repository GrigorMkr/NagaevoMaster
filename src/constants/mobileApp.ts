import { SITE_URL } from './app';
import appVersion from '@/data/appVersion.json';

const MOBILE_APP_ID = 'ru.nagaevomaster.app';
const MOBILE_APP_VERSION = appVersion.version;
const MOBILE_APP_VERSION_CODE = appVersion.versionCode;
const MOBILE_APP_RELEASED_AT = appVersion.releasedAt;
const MOBILE_APP_APK_SIZE_MB = appVersion.apkSizeMb;
const MOBILE_APP_RELEASE_NOTES = appVersion.releaseNotes;
const MOBILE_APP_APK_URL = `${SITE_URL}/downloads/nagaevomaster.apk`;

function resolveMobileApkFileName(version: string, apkFileName?: string): string {
  if (typeof apkFileName === 'string' && apkFileName.trim()) {
    return apkFileName.trim();
  }
  return `nagaevomaster-${version}.apk`;
}

function resolveMobileApkDownloadUrl(version: string, apkFileName?: string): string {
  return `${SITE_URL}/downloads/${resolveMobileApkFileName(version, apkFileName)}`;
}
const MOBILE_APP_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${MOBILE_APP_ID}`;
const MOBILE_APP_RUSTORE_URL = typeof appVersion.rustoreUrl === 'string' && appVersion.rustoreUrl
  ? appVersion.rustoreUrl
  : `https://www.rustore.ru/catalog/app/${MOBILE_APP_ID}`;
const MOBILE_APP_RUSTORE_PUBLISHED = appVersion.rustorePublished === true;
const MOBILE_APP_APP_STORE_URL = 'https://apps.apple.com/app/nagaevo-master/id0000000000';

export {
  MOBILE_APP_ID,
  MOBILE_APP_VERSION,
  MOBILE_APP_VERSION_CODE,
  MOBILE_APP_RELEASED_AT,
  MOBILE_APP_APK_SIZE_MB,
  MOBILE_APP_RELEASE_NOTES,
  MOBILE_APP_APK_URL,
  MOBILE_APP_PLAY_STORE_URL,
  MOBILE_APP_RUSTORE_URL,
  MOBILE_APP_RUSTORE_PUBLISHED,
  MOBILE_APP_APP_STORE_URL,
  resolveMobileApkFileName,
  resolveMobileApkDownloadUrl,
};
