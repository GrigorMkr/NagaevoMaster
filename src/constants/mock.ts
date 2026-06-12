/** Даты и пороги для демо-отзывов */
const MOCK_REVIEW_DATE = {
  yearMonth: '2026-01',
  timeUtc: '10:00:00Z',
  dayBase: 28,
  dayMin: 5,
} as const

const MOCK_REVIEW_RATING_THRESHOLDS = {
  excellent: 4.8,
  good: 4.5,
} as const

const MOCK_FEATURED_REVIEW_LISTING_IDS = [
  '1',
  '2',
  '10',
  '12',
  '16',
  '20',
  '24',
] as const

export {
  MOCK_REVIEW_DATE,
  MOCK_REVIEW_RATING_THRESHOLDS,
  MOCK_FEATURED_REVIEW_LISTING_IDS,
}
