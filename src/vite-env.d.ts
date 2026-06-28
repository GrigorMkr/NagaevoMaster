/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK_FALLBACK?: string
  readonly VITE_SITE_CLOSED?: string
  readonly VITE_PREVIEW_ACCESS_KEY?: string
  readonly VITE_MAP_TOKEN?: string
  readonly VITE_VK_WIDGETS_API_ID?: string
  readonly VITE_VK_COMMUNITY_ID?: string
  readonly VITE_VK_VIDEO_URL?: string
  readonly VITE_VK_VIDEO_OID?: string
  readonly VITE_VK_VIDEO_ID?: string
  readonly VITE_VK_VIDEO_HASH?: string
  readonly VITE_VK_VIDEO_HD?: string
  readonly VITE_VK_VIDEO_AUTOPLAY?: string
  readonly VITE_VK_VIDEO_LOOP?: string
  readonly VITE_VK_VIDEO_START?: string
  readonly VITE_VK_WALL_POST_OWNER_ID?: string
  readonly VITE_VK_WALL_POST_ID?: string
  readonly VITE_VK_WALL_POST_HASH?: string
  readonly VITE_VK_CONTACT_US_TEXT?: string
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string
  readonly VITE_YANDEX_SITE_VERIFICATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
