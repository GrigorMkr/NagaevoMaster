# Поисковая индексация (Google, Яндекс)

## Что уже настроено в проекте

- `robots.txt` — разрешена индексация публичных страниц
- `sitemap.xml` — карта сайта (генерируется при `npm run build:hosting`)
- Статический текст в `index.html` для роботов до загрузки React
- JSON-LD (Organization + WebSite)
- `noindex` на личных страницах (`/auth`, `/profile`, …)

## 1. Google Search Console (обязательно)

Без этого Google может месяцами не показывать новый сайт.

1. Откройте [Google Search Console](https://search.google.com/search-console)
2. **Добавить ресурс** → **Домен** или **Префикс URL**: `https://nagaevomaster.ru`
3. Подтвердите владение одним из способов:
   - **HTML-тег** — скопируйте код в `.env.production`:
     ```
     VITE_GOOGLE_SITE_VERIFICATION=ваш_код_из_консоли
     ```
     Затем: `npm run build:hosting` → `npm run deploy:hosting`
   - или **DNS TXT** в REG.RU (надёжнее, не сбрасывается при деплое)
4. После подтверждения: **Файлы Sitemap** → добавить  
   `https://nagaevomaster.ru/sitemap.xml`
5. **Проверка URL** → `https://nagaevomaster.ru/` → **Запросить индексирование**

Первые результаты в поиске обычно через **3–14 дней**, иногда быстрее после ручного запроса.

## 2. Яндекс.Вебмастер

1. [webmaster.yandex.ru](https://webmaster.yandex.ru)
2. Добавить сайт `https://nagaevomaster.ru`
3. Подтвердить (meta-тег или DNS)
4. Загрузить sitemap: `https://nagaevomaster.ru/sitemap.xml`

## 3. Проверка

```text
https://nagaevomaster.ru/robots.txt
https://nagaevomaster.ru/sitemap.xml
```

В Google: `site:nagaevomaster.ru`

## 4. Если сайт не в выдаче

| Причина | Решение |
|---------|---------|
| Сайт новый | Search Console + запрос индексации |
| Не подтверждён домен | DNS или meta-тег |
| `VITE_SITE_CLOSED=true` | Уберите из `.env.production` |
| Мало ссылок на сайт | Укажите URL в VK, RuStore, подписи email |
