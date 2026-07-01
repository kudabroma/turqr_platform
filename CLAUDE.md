# TurQR — CLAUDE.md

Рабочий справочник по архитектуре проекта. Читай в начале каждой сессии.

---

## 1. Что такое TurQR

Платформа мультиязычных QR-меню для ресторанов в Турции. Турист сканирует QR-код → попадает на публичное меню на своём языке. Ресторатор управляет меню через браузер.

---

## 2. Стек и деплой

| Компонент | Технологии | URL (прод) |
|---|---|---|
| `/back` | Django 6.0.3 + DRF 3.17 + PostgreSQL | `api.turqr.com` |
| `/front_admin` | React/Vite/TS + TanStack Query | `app.turqr.com` |
| `/front_public` | React/Vite/TS | `menu.turqr.com` |
| Медиа | Cloudflare R2 (boto3/django-storages) | `media.turqr.com` |
| Деплой бэка | Railway (gunicorn, Procfile) | — |

**Auth:** JWT (djangorestframework-simplejwt). Access token 10h, refresh 7d, хранится в `localStorage` как `access_token`. Header: `Authorization: Bearer <token>`.

**Throttle:** `AnonRateThrottle` 30/hour в проде. В DEBUG (`DJANGO_DEBUG=1`) — не действует.

**Медиа:** Переключается через `USE_R2=1` в `.env`. При `0` — локальная папка `/back/media/`.

**Субдомен:** `RestaurantSubdomainMiddleware` (`restaurants/middleware.py`) парсит slug из субдомена (`turko.turqr.com` → `slug="turko"`). Зарезервированы: `www`, `api`, `admin`.

---

## 3. Структура бэка (`/back`)

```
back/
  config/
    settings.py       # вся конфигурация (DB, R2, JWT, CORS, throttle)
    urls.py           # root urlconf: /api/ → restaurants.urls, /superadmin/ → restaurants.superadmin_urls
  restaurants/
    models.py         # Restaurant, User(AbstractUser), Category, Dish, Subscription, PaymentHistory
    views.py          # бизнес-API ресторатора (CategoryViewSet, DishViewSet, MenuView, RestaurantMeView, Auth…)
    views_public.py   # публичные эндпойнты (PublicRestaurantView, PublicMenuView)
    serializers.py    # сериализаторы ресторатора (CategorySerializer, DishSerializer, RestaurantMeSerializer…)
    serializers_public.py  # PublicRestaurantSerializer, PublicCategorySerializer + _resolve_i18n()
    superadmin_views.py    # суперадминские вьюхи
    superadmin_serializers.py  # SuperAdminRestaurantSerializer, SuperAdminRestaurantUpdateSerializer…
    superadmin_urls.py     # /superadmin/restaurants/, /superadmin/users/
    urls.py           # /api/public/…, /api/auth/…, /api/categories/, /api/dishes/…
    middleware.py     # RestaurantSubdomainMiddleware
    permissions.py    # HasActiveSubscriptionOrReadOnly
    utils/lang.py     # normalize_lang(), get_lang()
    services/unsorted.py  # get_unsorted_category()
    migrations/       # последняя: 0026_restaurant_enabled_languages.py
    qr/               # генератор QR-кодов
```

### Ключевые модели

**Restaurant:** `name`, `slug` (unique), `active`, `description_tr/en/ru` (старые), `description_i18n` (JSON), `enabled_languages` (JSON, default `["tr","ru","en"]`), `photo1..6`, `logo`, `working_hours`, `phone`, `email`, `address`.

**Category:** `name` (старое), `name_tr/en/ru` (старые), `name_i18n` (JSON), `restaurant` (FK), `sort_order`, `is_system`.

**Dish:** `name`, `name_tr/en/ru` (старые), `description_tr/en/ru` (старые), `name_i18n` (JSON), `description_i18n` (JSON), `price`, `image`, `category` (FK), `restaurant` (FK), `is_active`, `is_vegan`, `is_spicy`, `is_gluten_free`.

**User:** `AbstractUser` + `restaurant` (FK, nullable) — один ресторатор = один ресторан.

---

## 4. Структура фронт-админки (`/front_admin/src`)

```
api/          # api.ts — обёртка fetch с JWT-хедером
auth/         # LoginPage, контекст авторизации
pages/
  admin/      # AdminDashboard.tsx, CategoriesPage.tsx, DishesPage.tsx — ресторатор
  super/      # (суперадмин через legacy роутинг)
superadmin/
  api/superadmin.ts        # все SA API-функции: getRestaurants, updateRestaurantLanguages…
  types/superadmin.ts      # Restaurant, BusinessUser, Subscription, Payment interfaces
  pages/superadmin/
    Restaurants.tsx         # главная страница суперадминки
    BusinessUsers.tsx
    Dashboard.tsx
    Payments.tsx
    Subscriptions.tsx
    Settings.tsx
components/   # переиспользуемые UI-компоненты
```

### API-слой суперадминки

Файл: `superadmin/api/superadmin.ts`  
Все запросы идут через `api<T>(url, options)` → `fetch(VITE_API_URL + url)` с JWT-хедером.  
`normalizeRestaurant(raw)` — нормализует ответ бэка (включая `enabled_languages`).

---

## 5. Структура паблик-фронта (`/front_public/src`)

```
api/public.ts           # fetchPublicRestaurant(), fetchPublicMenu()
api/adapters/           # menuAdapter.ts — адаптирует ответ API к UI-структуре
config/langConfig.ts    # LANG_META (8 языков, флаги), getLangMeta()
context/LanguageContext.tsx
data/menuData.ts        # uiTranslations (UI-строки), getRestaurantMeta()
pages/
  MenuPage.tsx          # основная страница меню (rawLang → queries → lang после данных)
  PreviewPage.tsx       # preview-страница ресторана
components/
  LanguageSwitcher.tsx  # динамический переключатель языков
  DishCard.tsx
  CategoryTabs.tsx
  SearchBar.tsx
  DishDetailsModal.tsx
utils/publicSlug.ts     # getPublicSlugFromLocation()
```

---

## 6. Архитектура мультиязычности (рефакторинг завершён, этапы 1-4)

### Хранение переводов

Переводы хранятся в JSON-полях:
- `Dish.name_i18n`, `Dish.description_i18n`
- `Category.name_i18n`
- `Restaurant.description_i18n`

Формат: `{"tr": "Izgara tavuk", "ru": "Курица гриль", "en": "Grilled chicken"}`

**Старые колонки** (`name_tr`, `name_ru`, `name_en`, `description_tr` и т.д.) ещё существуют как страховка. Удалить после полной проверки прода.

### Fallback-цепочка (бэк)

Функция `_resolve_i18n(i18n, lang, *flat_fallbacks)` в `serializers_public.py`:
1. `i18n[запрошенный_язык]`
2. `i18n["en"]`
3. `i18n["tr"]`
4. Старые flat-колонки (safety net)

### enabled_languages

`Restaurant.enabled_languages` — JSONField, callable default `_default_languages()` → `["tr","ru","en"]`.

- Управляется ТОЛЬКО суперадмином через `PATCH /superadmin/restaurants/{id}/`
- Читается ресторатором и публикой (read-only)
- Поддерживаемые языки (8): `tr, ru, en, de, no, da, sv, fi`
- Валидация: `_VALID_LANGUAGES` в `superadmin_serializers.py`; `tr` всегда обязателен

### normalize_lang (бэк)

`restaurants/utils/lang.py` → `normalize_lang(raw, enabled_languages=None)`:
- Нормализует код (`en-US` → `en`)
- Проверяет против `enabled_languages` ресторана
- Fallback: первый элемент `enabled_languages`, затем `"tr"`

### LanguageSwitcher (фронт-паблик)

`front_public/src/components/LanguageSwitcher.tsx`:
- Проп `enabledLanguages?: string[]` (опциональный, fallback `["tr","ru","en"]`)
- ≤3 языка → pill-кнопки, ≥4 → `<select>` dropdown
- Флаги и labels из `getLangMeta()` (`config/langConfig.ts`)
- Используется в `MenuPage.tsx` и `PreviewPage.tsx`

### MenuPage — split rawLang/lang

В `MenuPage.tsx` два шага:
1. `rawLang` — простой парс URL (`?lang=ru`) → используется в `queryKey` для TanStack Query
2. После получения данных ресторана: `lang = normalizeLang(rawLang, enabledLanguages)` — валидированный
3. `useEffect` авто-редирект если `rawLang` не в `enabledLanguages`

### Суперадминка — управление языками

`front_admin/src/superadmin/pages/superadmin/Restaurants.tsx`:
- Колонка "Languages": `LanguageChips` показывает первые 3 флага + `+N`
- Кнопка "Languages" (Globe icon) открывает диалог
- Диалог: 8 чекбоксов, `tr` всегда disabled/checked
- `updateRestaurantLanguages(id, langs)` → `PATCH /superadmin/restaurants/{id}/`
- Toast при успехе и при ошибке (destructive вариант)

---

## 7. Таблица «симптом → файл»

| Задача | Куда идти |
|---|---|
| Добавить новый язык (9-й) | `back/restaurants/superadmin_serializers.py` → `_VALID_LANGUAGES`; `front_public/src/config/langConfig.ts` → `LANG_META`; `front_admin/src/superadmin/pages/superadmin/Restaurants.tsx` → `ALL_LANGUAGES` |
| Починить перевод блюда/категории | `back/restaurants/serializers_public.py` → `_resolve_i18n()` и `get_name`/`get_description` методы |
| Изменить fallback-порядок языков | `back/restaurants/serializers_public.py` → `_resolve_i18n()` |
| Починить переключатель языков | `front_public/src/components/LanguageSwitcher.tsx` |
| Добавить UI-строку для нового языка | `front_public/src/data/menuData.ts` → `uiTranslations` |
| Публичные данные ресторана | `back/restaurants/views_public.py` + `serializers_public.py` |
| API ресторатора (блюда, категории) | `back/restaurants/views.py` + `serializers.py` |
| Суперадминские эндпойнты | `back/restaurants/superadmin_views.py` + `superadmin_serializers.py` |
| Медиа-файлы не загружаются | `.env` → `USE_R2`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID` |
| Субдоменный роутинг сломался | `back/restaurants/middleware.py` → `RestaurantSubdomainMiddleware` |
| Новая миграция | `python manage.py makemigrations restaurants && python manage.py migrate` |

---

## 8. Команды разработки

### Бэк

```bash
cd back
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver                     # :8000

# Переменные окружения (back/.env):
# DJANGO_DEBUG=1
# DJANGO_SECRET_KEY=...
# DATABASE_URL=postgresql://...  (или не ставить — будет SQLite)
# USE_R2=0                       (медиа локально)
# ANTHROPIC_API_KEY=...          (для этапа 5 — ИИ-перевод)
```

### Фронты

```bash
cd front_admin && npm run dev    # :5174 (или auto)
cd front_public && npm run dev   # :5173 (или auto)

# front_admin/.env.local:
# VITE_API_URL=http://localhost:8000/api

# front_public/.env.local:
# VITE_API_URL=http://localhost:8000/api
```

### Тесты

```bash
cd back
python manage.py test restaurants
# или
python -m pytest
```

---

## 9. Текущий статус рефактора мультиязычности

| Этап | Статус | Суть |
|---|---|---|
| 1 — JSON-поля | ✅ Завершён | `name_i18n`/`description_i18n` JSONField на Dish, Category, Restaurant; миграции 0024-0025 |
| 2 — enabled_languages | ✅ Завершён | `Restaurant.enabled_languages`; миграция 0026; суперадмин read/write |
| 3 — Динамический переключатель | ✅ Завершён | `LanguageSwitcher` из `enabled_languages`; 8 языков в `LANG_META` |
| 4 — Управление языками в SA | ✅ Завершён | Диалог в `Restaurants.tsx`; PATCH API; toast ошибок |
| 5 — ИИ-перевод | 🔄 В работе | Anthropic API (claude-haiku-4-5-20251001), `ANTHROPIC_API_KEY`, в admin-ке ресторатора |
| 6 — UI-строки для 8 языков | ⏳ Впереди | `uiTranslations` в `front_public/src/data/menuData.ts` |
| 7 — Переводы категорий + редизайн | ⏳ Впереди | — |

**Старые i18n-колонки** (`name_tr/en/ru`, `description_tr/en/ru`) удалить отдельной миграцией после проверки прода.

---

## 10. Важные инварианты

- `tr` всегда должен быть в `enabled_languages` — это язык-основа ресторана в Турции.
- `_default_languages()` — callable, не литерал `["tr","ru","en"]` (избегает Django warning о mutable default).
- `_resolve_i18n` никогда не возвращает пустую строку если есть хоть какое-то значение в цепочке.
- Публичные эндпойнты (`/api/public/`) не требуют аутентификации, но проверяют активность подписки ресторана (в DEBUG разрешено без подписки).
- Суперадмин-эндпойнты (`/api/superadmin/`) защищены permission `IsSuperUser` (`permissions.py`).
