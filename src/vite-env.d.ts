/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK_FALLBACK?: string
  readonly VITE_SITE_CLOSED?: string
  readonly VITE_PREVIEW_ACCESS_KEY?: string
  readonly VITE_MAP_TOKEN?: string
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string
  readonly VITE_YANDEX_SITE_VERIFICATION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
