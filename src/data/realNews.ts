import type { NewsItem } from '@/types/news';

/** Local demo covers — nagaevodk.ru image host is often unreachable from Pages. */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const NAGAEVO_ARTICLE_IMAGES: Record<string, string> = {
  '/news/2026/04/4827/': asset('backgrounds/desktop-red-lake.jpg'),
  '/news/2026/04/4823/': asset('backgrounds/desktop-mountain-mist.jpg'),
  '/news/2026/04/4815/': asset('backgrounds/desktop-turquoise-lake.jpg'),
  '/news/2026/04/4806/': asset('features/forum-settlement.png'),
  '/afisha/2026/04/4803/': asset('backgrounds/desktop-river-bend.jpg'),
  '/news/2026/04/4790/': asset('features/verified-masters.png'),
  '/news/2026/04/4778/': asset('features/local-search.png'),
  '/afisha/2026/04/4775/': asset('about-images/audience.png'),
};

const NEWS_IMAGE_FALLBACK = asset('backgrounds/desktop-mountain-mist.jpg');

const REAL_LOCAL_NEWS: NewsItem[] = [
  {
    id: 'local-4827',
    title: 'С Международным днём танца — наши искренние поздравления!',
    summary: 'Нагаевский ДК поздравил педагогов хореографии и всех участников творческих коллективов с праздником искусства танца.',
    imageUrl: NAGAEVO_ARTICLE_IMAGES['/news/2026/04/4827/']!,
    sourceUrl: 'https://nagaevodk.ru/news/2026/04/4827/',
    sourceName: 'ДК с. Нагаево',
    publishedAt: '2026-04-29T11:57:31Z',
    category: 'local',
  },
  {
    id: 'local-4815',
    title: 'Праздничный концерт «Во славу Победы!»',
    summary: 'Нагаевский дом культуры приглашает жителей на торжественный концерт, посвящённый памяти героев Великой Отечественной войны.',
    imageUrl: NAGAEVO_ARTICLE_IMAGES['/news/2026/04/4815/']!,
    sourceUrl: 'https://nagaevodk.ru/news/2026/04/4815/',
    sourceName: 'ДК с. Нагаево',
    publishedAt: '2026-04-28T04:37:52Z',
    category: 'local',
  },
  {
    id: 'local-4806',
    title: 'Триумф ансамбля «Жар-птица» на конкурсе «Звезда Башкортостана»',
    summary: 'Юные танцоры Нагаевского ДК одержали победы на XX юбилейном открытом чемпионате по восточным танцам.',
    imageUrl: NAGAEVO_ARTICLE_IMAGES['/news/2026/04/4806/']!,
    sourceUrl: 'https://nagaevodk.ru/news/2026/04/4806/',
    sourceName: 'ДК с. Нагаево',
    publishedAt: '2026-04-27T12:54:00Z',
    category: 'local',
  },
  {
    id: 'local-4803',
    title: 'Митинг, посвящённый 81-й годовщине Победы',
    summary: 'Жители микрорайона Нагаево собрались на торжественный митинг в память о героях Великой Отечественной войны.',
    imageUrl: NAGAEVO_ARTICLE_IMAGES['/afisha/2026/04/4803/']!,
    sourceUrl: 'https://nagaevodk.ru/afisha/2026/04/4803/',
    sourceName: 'ДК с. Нагаево',
    publishedAt: '2026-04-27T10:24:22Z',
    category: 'local',
  },
  {
    id: 'local-4790',
    title: 'Отчётный концерт «БраВо!» в Нагаевском доме культуры',
    summary: 'Праздник искусства: зажигательные танцы, вокальные номера и яркие сцены от творческих объединений ДК.',
    imageUrl: NAGAEVO_ARTICLE_IMAGES['/news/2026/04/4790/']!,
    sourceUrl: 'https://nagaevodk.ru/news/2026/04/4790/',
    sourceName: 'ДК с. Нагаево',
    publishedAt: '2026-04-27T04:28:46Z',
    category: 'local',
  },
  {
    id: 'local-4778',
    title: 'Победы ансамбля «Жар-птица» на чемпионате по восточным танцам',
    summary: 'На прошедших выходных участники ансамбля танца «Жар-птица» блестяще выступили на юбилейном чемпионате.',
    imageUrl: NAGAEVO_ARTICLE_IMAGES['/news/2026/04/4778/']!,
    sourceUrl: 'https://nagaevodk.ru/news/2026/04/4778/',
    sourceName: 'ДК с. Нагаево',
    publishedAt: '2026-04-20T10:00:00Z',
    category: 'local',
  },
];

const REAL_EXTERNAL_NEWS: NewsItem[] = [
  {
    id: 'ext-logistics',
    title: 'Возле Нагаево построят логистический парк «Перспектива»',
    summary: 'На стыке трассы М-5 и Нагаевского шоссе началось строительство складского комплекса класса А площадью 31 га. Сдача — в 2027 году.',
    imageUrl: asset('backgrounds/desktop-river-bend.jpg'),
    sourceUrl: 'https://www.bashinform.ru/news/economy/2026-04-15/v-ufe-vozle-nagaevo-postroyat-logisticheskiy-park-vysshey-kategorii-4652378',
    sourceName: 'Башинформ',
    publishedAt: '2026-04-15T10:00:00Z',
    category: 'external',
  },
  {
    id: 'ext-yurta',
    title: 'В Нагаево открыли башкирский музей-юрту',
    summary: 'Альфия Юсупова создала аутентичный музей-юрту в селе Нагаево — с мастер-классами, национальными чаепитиями и экскурсиями.',
    imageUrl: asset('about-images/geography.png'),
    sourceUrl: 'https://www.bashinform.ru/news/social/2026-05-07/ufimke-pomogli-otkryt-bashkirskiy-yurta-muzey-4654118',
    sourceName: 'Башинформ',
    publishedAt: '2026-05-07T12:00:00Z',
    category: 'external',
  },
  {
    id: 'ext-school',
    title: 'В Нагаево планируют построить новую школу с детским садом',
    summary: 'Глава Башкирии сообщил о начале строительства в 2027–2028 годах. В 147-й школе сейчас обучается более 3700 учеников.',
    imageUrl: asset('about-images/mission.png'),
    sourceUrl: 'https://www.bashinform.ru/news/social/2025-03-20/glava-bashkirii-rasskazal-o-planah-stroitelstva-novoy-shkoly-v-sele-nagaevo-4165164',
    sourceName: 'Башинформ',
    publishedAt: '2025-03-20T11:21:00Z',
    category: 'external',
  },
  {
    id: 'ext-school-land',
    title: 'Инвестору выделили землю в Нагаево под строительство школы',
    summary: 'Уфимская компания получила участки под частную школу на 300 мест и детский сад на 140 мест, а также спортивную площадку.',
    imageUrl: asset('features/local-search.png'),
    sourceUrl: 'https://www.bashinform.ru/news/economy/2025-04-03/v-ufe-investoru-vydelili-zemlyu-v-nagaevo-pod-stroitelstvo-shkoly-4183176',
    sourceName: 'Башинформ',
    publishedAt: '2025-04-03T13:36:00Z',
    category: 'external',
  },
  {
    id: 'ext-water',
    title: 'Нагаево получит водоснабжение в рамках развития Зауфимья',
    summary: 'Глава Башкирии: федеральная поддержка 13,5 млрд рублей позволит обеспечить водой каждый населённый пункт Зауфимья, включая Нагаево.',
    imageUrl: asset('backgrounds/desktop-turquoise-lake.jpg'),
    sourceUrl: 'https://www.bashinform.ru/articles/detalno/2025-09-11/gde-zhivem-rabotaem-i-otdyhaem-kak-v-bashkirii-povyshayut-kachestvo-zhizni-4382918',
    sourceName: 'Башинформ',
    publishedAt: '2025-09-11T10:00:00Z',
    category: 'external',
  },
];

export {
  NAGAEVO_ARTICLE_IMAGES,
  NEWS_IMAGE_FALLBACK,
  REAL_LOCAL_NEWS,
  REAL_EXTERNAL_NEWS,
};
