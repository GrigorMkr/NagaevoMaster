interface Subcategory {
    id: string;
    slug: string;
    name: string;
}
interface ServiceCategory {
    id: string;
    slug: string;
    name: string;
    icon: string;
    description: string;
    subcategories: Subcategory[];
}
const SERVICE_CATEGORIES: ServiceCategory[] = [
    {
        id: 'construction',
        slug: 'construction',
        name: 'Строительство и ремонт',
        icon: '🏗️',
        description: 'Строители, отделка, сантехника, электрика, кровля и фасады',
        subcategories: [
            { id: 'builders', slug: 'builders', name: 'Строители' },
            { id: 'finishers', slug: 'finishers', name: 'Отделочники' },
            { id: 'tilers', slug: 'tilers', name: 'Плиточники' },
            { id: 'flooring', slug: 'flooring', name: 'Напольные покрытия' },
            { id: 'roofers', slug: 'roofers', name: 'Кровельщики' },
            { id: 'plumbers', slug: 'plumbers', name: 'Сантехники' },
            { id: 'electricians', slug: 'electricians', name: 'Электрики' },
            { id: 'gas', slug: 'gas', name: 'Газовики' },
            { id: 'hvac', slug: 'hvac', name: 'Отопление и вентиляция' },
            { id: 'facade', slug: 'facade', name: 'Фасадные работы' },
            { id: 'landscape', slug: 'landscape', name: 'Ландшафтные дизайнеры' },
            { id: 'glazing', slug: 'glazing', name: 'Остекление' },
            { id: 'fences', slug: 'fences', name: 'Заборы и ограждения' },
            { id: 'concrete', slug: 'concrete', name: 'Бетонные работы' },
        ],
    },
    {
        id: 'machinery',
        slug: 'machinery',
        name: 'Спецтехника и оборудование',
        icon: '🚜',
        description: 'Экскаваторы, тракторы, краны, ассенизаторы и дорожная техника',
        subcategories: [
            { id: 'earthmoving', slug: 'earthmoving', name: 'Землеройная техника' },
            { id: 'trucks', slug: 'trucks', name: 'Грузовая техника' },
            { id: 'agri-machinery', slug: 'agri-machinery', name: 'Сельхозтехника' },
            { id: 'construction-equip', slug: 'construction-equip', name: 'Строительное оборудование' },
            { id: 'lifting', slug: 'lifting', name: 'Подъёмная техника' },
            { id: 'cleaning-machinery', slug: 'cleaning-machinery', name: 'Уборочная техника' },
            { id: 'septic-trucks', slug: 'septic-trucks', name: 'Ассенизаторская техника' },
            { id: 'road', slug: 'road', name: 'Дорожная техника' },
        ],
    },
    {
        id: 'utility',
        slug: 'utility',
        name: 'Коммунальные и бытовые услуги',
        icon: '🧹',
        description: 'Ассенизаторы, вывоз мусора, уборка, септики, водоснабжение',
        subcategories: [
            { id: 'septic-service', slug: 'septic-service', name: 'Ассенизаторы' },
            { id: 'waste', slug: 'waste', name: 'Вывоз мусора' },
            { id: 'territory-cleaning', slug: 'territory-cleaning', name: 'Уборка территорий' },
            { id: 'pest-control', slug: 'pest-control', name: 'Дератизация и дезинсекция' },
            { id: 'septic-install', slug: 'septic-install', name: 'Септики и канализация' },
            { id: 'water', slug: 'water', name: 'Водоснабжение' },
            { id: 'firewood', slug: 'firewood', name: 'Дрова и уголь' },
            { id: 'tire-service', slug: 'tire-service', name: 'Шиномонтаж' },
            { id: 'equipment-repair', slug: 'equipment-repair', name: 'Ремонт техники' },
            { id: 'diagnostics', slug: 'diagnostics', name: 'Диагностика' },
        ],
    },
    {
        id: 'staff',
        slug: 'staff',
        name: 'Домашний персонал и услуги',
        icon: '🏠',
        description: 'Уборка, сиделки, няни, садовники, повары и разнорабочие',
        subcategories: [
            { id: 'cleaners', slug: 'cleaners', name: 'Уборщицы' },
            { id: 'caregivers', slug: 'caregivers', name: 'Сиделки' },
            { id: 'nannies', slug: 'nannies', name: 'Няни' },
            { id: 'gardeners', slug: 'gardeners', name: 'Садовники' },
            { id: 'cooks', slug: 'cooks', name: 'Повары' },
            { id: 'handymen', slug: 'handymen', name: 'Разнорабочие' },
            { id: 'housekeepers', slug: 'housekeepers', name: 'Домработницы' },
        ],
    },
    {
        id: 'logistics',
        slug: 'logistics',
        name: 'Грузоперевозки и логистика',
        icon: '🚚',
        description: 'Переезды, доставка стройматериалов и эвакуаторы',
        subcategories: [
            { id: 'apartment-move', slug: 'apartment-move', name: 'Квартирные переезды' },
            { id: 'country-move', slug: 'country-move', name: 'Дачные переезды' },
            { id: 'office-move', slug: 'office-move', name: 'Офисные переезды' },
            { id: 'materials-delivery', slug: 'materials-delivery', name: 'Доставка стройматериалов' },
            { id: 'evacuator', slug: 'evacuator', name: 'Перевозка техники' },
            { id: 'furniture-delivery', slug: 'furniture-delivery', name: 'Доставка мебели' },
        ],
    },
    {
        id: 'farming',
        slug: 'farming',
        name: 'Фермерские и сельхозуслуги',
        icon: '🌾',
        description: 'Вспашка, культивация, покос, заготовка сена',
        subcategories: [
            { id: 'plowing', slug: 'plowing', name: 'Вспашка огорода' },
            { id: 'cultivation', slug: 'cultivation', name: 'Культивация и дискование' },
            { id: 'harrowing', slug: 'harrowing', name: 'Боронование' },
            { id: 'mowing', slug: 'mowing', name: 'Покос травы' },
            { id: 'hay', slug: 'hay', name: 'Заготовка сена' },
            { id: 'chipping', slug: 'chipping', name: 'Дробление веток' },
            { id: 'fertilizing', slug: 'fertilizing', name: 'Внесение удобрений' },
            { id: 'seeding', slug: 'seeding', name: 'Посев зерновых' },
        ],
    },
    {
        id: 'pro',
        slug: 'pro',
        name: 'Профессиональные услуги',
        icon: '💼',
        description: 'Юристы, бухгалтеры, фотографы, риэлторы и репетиторы',
        subcategories: [
            { id: 'lawyers', slug: 'lawyers', name: 'Юристы' },
            { id: 'accountants', slug: 'accountants', name: 'Бухгалтеры' },
            { id: 'photographers', slug: 'photographers', name: 'Фотографы' },
            { id: 'realtors', slug: 'realtors', name: 'Риэлторы' },
            { id: 'wedding', slug: 'wedding', name: 'Свадебные организаторы' },
            { id: 'events', slug: 'events', name: 'Event-менеджеры' },
            { id: 'tutors', slug: 'tutors', name: 'Репетиторы' },
            { id: 'consultants', slug: 'consultants', name: 'Консультанты' },
            { id: 'designers', slug: 'designers', name: 'Дизайнеры интерьера' },
        ],
    },
    {
        id: 'sales',
        slug: 'sales',
        name: 'Торговля и продукция',
        icon: '🛒',
        description: 'Пиломатериалы, бетон, саженцы, продукция с хозяйства',
        subcategories: [
            { id: 'lumber', slug: 'lumber', name: 'Пиломатериалы' },
            { id: 'bulk-materials', slug: 'bulk-materials', name: 'Бетон, песок, щебень' },
            { id: 'seedlings', slug: 'seedlings', name: 'Саженцы и рассада' },
            { id: 'farm-products', slug: 'farm-products', name: 'Яйца, молоко, мёд, мясо' },
            { id: 'building-materials', slug: 'building-materials', name: 'Стройматериалы' },
            { id: 'firewood-sales', slug: 'firewood-sales', name: 'Дрова' },
        ],
    },
    {
        id: 'beauty',
        slug: 'beauty',
        name: 'Красота и здоровье',
        icon: '💇',
        description: 'Парикмахеры, барберы, маникюр, косметология, массаж',
        subcategories: [
            { id: 'hairdresser', slug: 'hairdresser', name: 'Парикмахерские услуги' },
            { id: 'barber', slug: 'barber', name: 'Барберские услуги' },
            { id: 'nails', slug: 'nails', name: 'Маникюр и педикюр' },
            { id: 'lashes', slug: 'lashes', name: 'Наращивание ресниц' },
            { id: 'brows', slug: 'brows', name: 'Брови' },
            { id: 'makeup', slug: 'makeup', name: 'Макияж' },
            { id: 'cosmetology', slug: 'cosmetology', name: 'Косметология' },
            { id: 'depilation', slug: 'depilation', name: 'Депиляция и шугаринг' },
            { id: 'massage', slug: 'massage', name: 'Массаж' },
            { id: 'tattoo', slug: 'tattoo', name: 'Тату и перманент' },
            { id: 'tanning', slug: 'tanning', name: 'Солярий и загар' },
            { id: 'pets', slug: 'pets', name: 'Стрижка животных' },
        ],
    },
];
const FORUM_CATEGORIES = [
    { slug: 'construction', name: 'Строительство', icon: '🏗️' },
    { slug: 'plumbing', name: 'Сантехника и отопление', icon: '🔧' },
    { slug: 'electric', name: 'Электрика', icon: '⚡' },
    { slug: 'machinery', name: 'Спецтехника', icon: '🚜' },
    { slug: 'septic', name: 'Ассенизаторы', icon: '🚛' },
    { slug: 'cleaning', name: 'Уборка и вывоз мусора', icon: '🧹' },
    { slug: 'beauty', name: 'Красота и здоровье', icon: '💇' },
    { slug: 'general', name: 'Общие вопросы', icon: '💬' },
] as const;
function getCategoryBySlug(slug: string): ServiceCategory | undefined {
    return SERVICE_CATEGORIES.find((c) => c.slug === slug);
}
function getBeautySubcategory(slug: string): Subcategory | undefined {
    const beauty = getCategoryBySlug('beauty');
    return beauty?.subcategories.find((s) => s.slug === slug);
}

export {
  SERVICE_CATEGORIES,
  FORUM_CATEGORIES,
  getCategoryBySlug,
  getBeautySubcategory,
}

export type {
  Subcategory,
  ServiceCategory,
}
