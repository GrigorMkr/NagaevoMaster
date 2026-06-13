import type { ListingAuthor } from '@/types/listing';
import { buildAvatarUrl } from '@/utils/avatarUrl';

const AUTHOR_PROFILES: Array<{
  id: string;
  name: string;
  login: string;
}> = [
  { id: 'u1', name: 'Ильдар Электрик', login: 'ildar_master' },
  { id: 'u2', name: 'Алексей Тракторист', login: 'alex_mtz' },
  { id: 'u3', name: 'Ринат Кровельщик', login: 'rinat_roof' },
  { id: 'u4', name: 'Сергей Ассенизатор', login: 'septic_sergey' },
  { id: 'u5', name: 'Марат Экскаватор', login: 'marat_digger' },
  { id: 'u6', name: 'Ольга Уборка', login: 'olga_clean' },
  { id: 'u7', name: 'Динара Парикмахер', login: 'dina_hair' },
  { id: 'u8', name: 'Камиль Барбер', login: 'kamil_barber' },
  { id: 'u9', name: 'Айгуль Маникюр', login: 'aigul_nails' },
  { id: 'u10', name: 'Руслан Сантехник', login: 'ruslan_plumb' },
  { id: 'u11', name: 'Виктор Переезд', login: 'victor_move' },
  { id: 'u12', name: 'Гульнара Массаж', login: 'gulnara_spa' },
  { id: 'u13', name: 'Тимур Газовик', login: 'timur_gas' },
  { id: 'u14', name: 'Елена Репетитор', login: 'elena_tutor' },
  { id: 'u15', name: 'Фарит Покос', login: 'farit_mow' },
  { id: 'u16', name: 'Зульфия Косметолог', login: 'zulfia_beauty' },
  { id: 'u17', name: 'Игорь Кран', login: 'igor_lift' },
  { id: 'u18', name: 'Лилия Фотограф', login: 'lilia_photo' },
  { id: 'u19', name: 'Дамир Отделка', login: 'damir_finish' },
  { id: 'u20', name: 'Светлана Сиделка', login: 'sveta_care' },
  { id: 'u21', name: 'Артур Шиномонтаж', login: 'artur_tires' },
  { id: 'u22', name: 'Марина Юрист', login: 'marina_law' },
  { id: 'u23', name: 'Рамиль Дрова', login: 'ramil_wood' },
  { id: 'u24', name: 'Наталья Дизайн', login: 'nataly_design' },
];

const MOCK_LISTING_AUTHORS: Record<string, ListingAuthor> = Object.fromEntries(
  AUTHOR_PROFILES.map((profile) => [
    profile.id,
    {
      id: profile.id,
      name: profile.name,
      login: profile.login,
      avatarUrl: buildAvatarUrl(profile.name, profile.login),
    },
  ]),
);

function getListingAuthor(userId: string, fallbackName?: string): ListingAuthor {
  const known = MOCK_LISTING_AUTHORS[userId];
  if (known) {
    return known;
  }

  const name = fallbackName ?? `Мастер ${userId}`;
  const login = `master_${userId}`;

  return {
    id: userId,
    name,
    login,
    avatarUrl: buildAvatarUrl(name, login),
  };
}

export {
  MOCK_LISTING_AUTHORS,
  getListingAuthor,
}
