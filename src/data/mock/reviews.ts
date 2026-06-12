export interface MockReview {
  id: string
  listingId?: string
  authorName: string
  rating: number
  text: string
  serviceTitle: string
  createdAt: string
}

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: 'r1',
    listingId: '1',
    authorName: 'Анна К.',
    rating: 5,
    text: 'Электрик приехал быстро, всё сделал качественно. Проводку в доме на Нагаевском шоссе полностью заменили. Мастер объяснил, что именно менял в щитке, оставил аккуратно убранное рабочее место.',
    serviceTitle: 'Электрик',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'r2',
    listingId: '2',
    authorName: 'Игорь М.',
    rating: 5,
    text: 'Тракторист отличный — вспахал огород на Полевой за полдня. Цена адекватная, договорились заранее по объёму работ и времени приезда.',
    serviceTitle: 'Аренда трактора',
    createdAt: '2026-01-18T10:00:00Z',
  },
  {
    id: 'r3',
    listingId: '3',
    authorName: 'Мария С.',
    rating: 4,
    text: 'Кровельщики сделали хорошо, но немного затянули сроки. Результатом довольна: крыша не течёт, стыки аккуратные, мусор после работы вывезли.',
    serviceTitle: 'Ремонт крыши',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'r4',
    authorName: 'Пётр В.',
    rating: 5,
    text: 'Ассенизатор приехал в тот же день. Септик откачали чисто, без запаха. Оплатили по факту, чек выдали.',
    serviceTitle: 'Ассенизатор',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'r5',
    authorName: 'Елена Д.',
    rating: 5,
    text: 'Нашла садовника через сайт — обрезали деревья на Садовой, всё аккуратно. Рекомендую! Ветки сложили в кучу для вывоза, как и договаривались.',
    serviceTitle: 'Уход за садом',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'r6',
    authorName: 'Рустам Г.',
    rating: 5,
    text: 'Заказывали дрова с доставкой на Рощинскую — привезли сухие, аккуратно сложили у сарая. Объём совпал с заявленным.',
    serviceTitle: 'Дрова',
    createdAt: '2026-01-08T10:00:00Z',
  },
  {
    id: 'r7',
    authorName: 'Ольга Н.',
    rating: 5,
    text: 'Маникюр на дому — очень удобно, мастер приехала вовремя, покрытие держится уже три недели. Инструменты стерильные, всё понравилось.',
    serviceTitle: 'Маникюр',
    createdAt: '2026-01-05T10:00:00Z',
  },
]

export function getReviewsForListing(listingId: string, serviceTitle: string): MockReview[] {
  const linkedReviews = MOCK_REVIEWS.filter((review) => review.listingId === listingId)
  if (linkedReviews.length > 0) {
    return linkedReviews
  }

  const previewCount = Math.min(3, MOCK_REVIEWS.length)
  return MOCK_REVIEWS.slice(0, previewCount).map((review, index) => ({
    ...review,
    id: `${listingId}-review-${index}`,
    listingId,
    serviceTitle,
  }))
}
