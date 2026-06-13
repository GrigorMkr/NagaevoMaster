import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'listings');

const THEMES = {
  electricians: { bg: ['#1a3a5c', '#2563eb'], label: 'Электрик', icon: '⚡' },
  'agri-machinery': { bg: ['#14532d', '#22c55e'], label: 'Трактор', icon: '🚜' },
  earthmoving: { bg: ['#78350f', '#f59e0b'], label: 'Экскаватор', icon: '🏗' },
  hairdresser: { bg: ['#831843', '#ec4899'], label: 'Парикмахер', icon: '✂' },
  barber: { bg: ['#1e293b', '#64748b'], label: 'Барбер', icon: '💈' },
  nails: { bg: ['#701a75', '#d946ef'], label: 'Маникюр', icon: '💅' },
  roofers: { bg: ['#7c2d12', '#ea580c'], label: 'Кровля', icon: '🏠' },
  plumbers: { bg: ['#0c4a6e', '#0ea5e9'], label: 'Сантехник', icon: '🔧' },
  'septic-service': { bg: ['#365314', '#84cc16'], label: 'Ассенизатор', icon: '🚛' },
  mowing: { bg: ['#166534', '#4ade80'], label: 'Покос', icon: '🌿' },
  cleaners: { bg: ['#134e4a', '#2dd4bf'], label: 'Уборка', icon: '🧹' },
  'country-move': { bg: ['#1e3a8a', '#3b82f6'], label: 'Переезд', icon: '📦' },
  plowing: { bg: ['#3f6212', '#a3e635'], label: 'Вспашка', icon: '🌾' },
  lawyers: { bg: ['#312e81', '#6366f1'], label: 'Юрист', icon: '⚖' },
  'firewood-sales': { bg: ['#422006', '#a16207'], label: 'Дрова', icon: '🪵' },
  water: { bg: ['#075985', '#38bdf8'], label: 'Вода', icon: '💧' },
  waste: { bg: ['#3f3f46', '#71717a'], label: 'Вывоз', icon: '♻' },
  gardeners: { bg: ['#14532d', '#86efac'], label: 'Сад', icon: '🌳' },
  glazing: { bg: ['#0e7490', '#67e8f9'], label: 'Остекление', icon: '🪟' },
  evacuator: { bg: ['#991b1b', '#f87171'], label: 'Эвакуатор', icon: '🚗' },
  'septic-install': { bg: ['#1d4ed8', '#60a5fa'], label: 'Септик', icon: '🛠' },
  tutors: { bg: ['#4c1d95', '#a78bfa'], label: 'Репетитор', icon: '📚' },
  'bulk-materials': { bg: ['#57534e', '#a8a29e'], label: 'Материалы', icon: '🧱' },
  builders: { bg: ['#9a3412', '#fb923c'], label: 'Строитель', icon: '👷' },
  photographers: { bg: ['#581c87', '#c084fc'], label: 'Фото', icon: '📷' },
  construction: { bg: ['#92400e', '#fbbf24'], label: 'Стройка', icon: '🏗' },
  machinery: { bg: ['#14532d', '#22c55e'], label: 'Техника', icon: '🚜' },
  utility: { bg: ['#0c4a6e', '#38bdf8'], label: 'Коммунальные', icon: '🔩' },
  beauty: { bg: ['#9d174d', '#f472b6'], label: 'Красота', icon: '✨' },
  farming: { bg: ['#3f6212', '#bef264'], label: 'Ферма', icon: '🌻' },
  default: { bg: ['#17624a', '#f0b429'], label: 'Услуга', icon: '★' },
};

function themeForFilename(filename) {
  const base = filename.replace(/-\d+\.svg$/, '');
  return THEMES[base] ?? THEMES.default;
}

function buildSvg(label, icon, [c1, c2]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="noise" x="0" y="0">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>
      <feColorMatrix type="saturate" values="0"/>
      <feBlend in="SourceGraphic" in2="n" mode="multiply"/>
    </filter>
  </defs>
  <rect width="800" height="450" fill="url(#g)"/>
  <circle cx="680" cy="80" r="120" fill="rgba(255,255,255,0.08)"/>
  <circle cx="120" cy="380" r="90" fill="rgba(0,0,0,0.12)"/>
  <text x="400" y="200" text-anchor="middle" font-size="96" fill="rgba(255,255,255,0.92)">${icon}</text>
  <text x="400" y="290" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700" fill="rgba(255,255,255,0.95)">${label}</text>
  <text x="400" y="340" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.7)">с. Нагаево</text>
</svg>`;
}

const FILENAMES = [
  'electricians-1', 'electricians-2',
  'agri-machinery-1', 'agri-machinery-2',
  'roofers-1', 'roofers-2',
  'septic-service-1',
  'earthmoving-1', 'earthmoving-2',
  'plumbers-1', 'plumbers-2',
  'cleaners-1',
  'country-move-1',
  'plowing-1',
  'lawyers-1',
  'firewood-sales-1',
  'nails-1', 'nails-2',
  'water-1',
  'barber-1', 'barber-2',
  'waste-1',
  'gardeners-1',
  'glazing-1',
  'evacuator-1',
  'septic-install-1',
  'tutors-1',
  'mowing-1', 'mowing-2',
  'bulk-materials-1',
  'builders-1', 'builders-2',
  'photographers-1',
  'construction-1', 'construction-2',
  'machinery-1',
  'utility-1',
  'beauty-1', 'beauty-2',
  'farming-1', 'farming-2',
  'default-1', 'default-2',
  'hairdresser-1', 'hairdresser-2',
];

await mkdir(outDir, { recursive: true });

for (const name of FILENAMES) {
  const filename = `${name}.svg`;
  const theme = themeForFilename(filename);
  const svg = buildSvg(theme.label, theme.icon, theme.bg);
  await writeFile(path.join(outDir, filename), svg, 'utf8');
  console.log(`OK  ${filename}`);
}

console.log(`\n${FILENAMES.length} SVG placeholders → ${outDir}`);
