const POPULAR_SERVICES = [
    { id: 'p1', title: 'Ремонт крыши', icon: '🔨', category: 'construction', subcategory: 'roofers', count: 8 },
    { id: 'p2', title: 'Аренда трактора', icon: '🚜', category: 'machinery', subcategory: 'agri-machinery', count: 4 },
    { id: 'p3', title: 'Электрик', icon: '⚡', category: 'construction', subcategory: 'electricians', count: 6 },
    { id: 'p4', title: 'Сантехник', icon: '🔧', category: 'construction', subcategory: 'plumbers', count: 5 },
    { id: 'p5', title: 'Ассенизатор', icon: '🚛', category: 'utility', subcategory: 'septic-service', count: 5 },
    { id: 'p6', title: 'Вывоз мусора', icon: '🗑️', category: 'utility', subcategory: 'waste', count: 4 },
    { id: 'p7', title: 'Уборка территории', icon: '🧹', category: 'staff', subcategory: 'cleaners', count: 3 },
    { id: 'p8', title: 'Перевозка грузов', icon: '🚚', category: 'logistics', subcategory: 'country-move', count: 4 },
    { id: 'p9', title: 'Вспашка огорода', icon: '🌾', category: 'farming', subcategory: 'plowing', count: 3 },
    { id: 'p10', title: 'Уход за садом', icon: '🌿', category: 'staff', subcategory: 'gardeners', count: 3 },
    { id: 'p11', title: 'Строительство бани', icon: '🛖', category: 'construction', subcategory: 'builders', count: 2 },
    { id: 'p12', title: 'Бурение скважин', icon: '💧', category: 'utility', subcategory: 'water', count: 3 },
    { id: 'p13', title: 'Маникюр', icon: '💅', category: 'beauty', subcategory: 'nails', count: 4 },
    { id: 'p14', title: 'Мужская стрижка', icon: '💇', category: 'beauty', subcategory: 'barber', count: 3 },
    { id: 'p15', title: 'Эвакуатор', icon: '🚗', category: 'logistics', subcategory: 'evacuator', count: 2 },
    { id: 'p16', title: 'Монтаж окон', icon: '🪟', category: 'construction', subcategory: 'glazing', count: 3 },
] as const;

export {
  POPULAR_SERVICES,
}
