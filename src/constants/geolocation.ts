/** Таймаут и кэш браузерной геолокации */
const GEOLOCATION_TIMEOUT_MS = 15_000
const GEOLOCATION_FRESH_TIMEOUT_MS = 30_000
const GEOLOCATION_MAX_AGE_MS = 30_000
/** Масштаб при показе «Моё местоположение» (улица/дом) */
const USER_LOCATION_MAP_ZOOM = 16
/** Не центрировать карту на сохранённых координатах старше этого срока */
const USER_LOCATION_AUTO_FLY_MAX_AGE_MS = 5 * 60_000

export {
  GEOLOCATION_TIMEOUT_MS,
  GEOLOCATION_FRESH_TIMEOUT_MS,
  GEOLOCATION_MAX_AGE_MS,
  USER_LOCATION_MAP_ZOOM,
  USER_LOCATION_AUTO_FLY_MAX_AGE_MS,
}
