**Краткое резюме.**
Новая страница `/profile/map` вводит полноценную карту Leaflet с тайлами OpenStreetMap, на которой в один клик визуализируются все **избранные** локации текущего пользователя. Компонент `LocationMap` остаётся полностью согласован c текущей архитектурой (Next 14 App Router + React Query + Zustand), использует уже существующие таблицы `locations` и `favourites`, поддерживает тёмную тему, поп‑апы с переходом на `LocationDetailPage`, фильтры из `Header / SearchBar`, оптимистичное кеш‑обновление и перерасчёт координат при редактировании карточек. Ниже приведён полный контекст и техническое описание фичи (без реализации кода).

---
## 1. Цели, аудитория и ограничения
| Аспект                  | Детали                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**          | «Как пользователь, я хочу видеть все свои избранные точки на интерактивной карте, чтобы быстро понять, где что находится» (см. UserStory‑BatumiTrip.md story 7). |
| **Количество маркеров** | ≤ 60 точек (ограничение из ТЗ). Массив без нагрузки на DOM‑производительность; при дальнейшем росте активируется кластеризация.                                  |
| **Тема**                | Обязательная Dark Theme для карты и всплывающих окон (см. StyleGuide‑BatumiTrip.md § 2).                                                                         |
| **Маршрут**             | Страница `/profile/map` со своим layout; интеграция с глобальным `Header` (фильтрация, кнопка «назад»).                                                          |

---
## 2. Данные, геокодинг и актуализация координат

### 2.1 Поток данных

1. **Создание / редактирование** локации вызывает Edge Function `geocode()` (уже используется в проекте) и записывает `address` + `lat/lng` в `public.locations` (см. DataModel‑BatumiTrip.md табл. `locations`).
2. Таблица `favourites` связывает пользователя с `location_id` (см. DataModel‑BatumiTrip.md § 2.5).
3. На страницу карты запрашиваются **только** избранные записи текущего пользователя (`SELECT … FROM locations JOIN favourites USING(location_id) WHERE user_id=$uid`).
4. При **редактировании** карточки вызывается RPC `update_location_with_tags`; если изменён адрес — Edge Function пересчитывает координаты (см. API‑BatumiTrip.md § RPC). React‑Query затем инвалидирует `['location', id]` и `['favourites', uid]`, а `LocationMap` получает свежие координаты.

### 2.2 Пустые состояния
* Нет избранных → текст «Добавьте локации в ⭐ избранное, чтобы увидеть их на карте».
* Избранные без координат → «Выбранные локации не имеют валидных координат; отредактируйте адрес».

---
## 3. Архитектура компонентов
| Уровень     | Компонент / файл                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page**    | `app/profile/map/page.js` (новый)                                                                                                              | Роут, lazy‑загрузка карты, Suspense для SSR.                         |
| **UI**      | `LocationMap.jsx`                                                                                                                              | Обёртка `MapContainer`, tile layer, маркеры, кластеризация, pop‑апы. |
| **State**   | Zustand `uiStore.showOnlyFavourites` + `searchQuery` + `selectedTags` (уже есть — см. StateManagement‑BatumiTrip.md § Zustand)                 | Влияют на фильтрацию маркеров.                                       |
| **Data**    | React‑Query hook `useFavouriteLocations()` (новый) — `useQuery(['favourites', uid, filters])`                                                  | Загружает до 60 объектов с `{ id, title, lat, lng }`.                |
| **Cluster** | Плагин Leaflet.markercluster (JS / CSS) для группировки, подключается динамически (ES‑import) ([GitHub][1]).                                   |  
| **Popup**   | Внутри `<Marker>` рендерится `<Popup>` с заголовком + `<Link>` на `/locations/[id]`  |

---
## 4. Отрисовка карты и тёмная тема

### 4.1 Базовый слой
* **URL по умолчанию** — публичные OSM тайлы `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`. Требуется указать атрибуцию OSM.
* **Dark Theme** — готовый стиль Carto DB **Dark Matter** `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` (бесплатно ≤ 250k тайлов/мес). Слой выбирается автоматически, если в `ThemeContext` активен класс `dark`.

> ⚠️  При использовании общедоступных тайл‑серверов нужно соблюдать политику нагрузки (≤ 4 parallel req, включить cache‑headers) и требуемый attribution © OpenStreetMap contributors.

### 4.2 Настройки `MapContainer`
| Параметр          | Значение                                                                  | Причина                                                                                  |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `center`          | bbox среднего Geo‑центра всех маркеров (вычисляется через `LatLngBounds`) | Вписывает набор точек в viewport.                                                        |
| `zoom`            | `13` (fallback)                                                           | Адекватен для городского масштаба; пересчитывается через `fitBounds`.                    |
| `preferCanvas`    | `true`                                                                    | Canvas‑рендер быстрее при большом числе точек |
| `zoomControl`     | `false` (mobile) / `true` (desktop)                                       | Упрощает UI на телефоне.                                                                 |
| `scrollWheelZoom` | `false` по умолчанию                                                      | Предотвращает непреднамеренный скролл.                                                   |

---
## 5. Маркеры и поп‑апы

### 5.1 Иконки

* Выбор SVG `<Star>` (lucide‑react) внутри кастомной `DivIcon`, чтобы сохранить единый стиль и тёмный фон (см. StyleGuide‑BatumiTrip.md § 8).
* Размер 24×24 px; цвет `var(--primary)` для активной темы.

### 5.2 Кластеризация
* Подключается плагин *Leaflet.markercluster* (180 KB gzip) только если `locations.length > 30`; по ТЗ до 60 точек, поэтому кластер экономит производительность и не перегружает карту.
* Для Layer Control требуется под‑плагин **LayerSupport**, чтобы кластер корректно реагировал на фильтры по тегам.

### 5.3 Popup контент
```js
<h3>{title}</h3>
<Link href={`/locations/${id}`}>Подробнее →</Link>
```

* CSS: dark `bg-card` / light `bg-card-foreground`.
* ARIA‑атрибут `role="dialog"` + фокус‑ловушка.

---
## 6. Интеграция фильтров поиска и тегов
1. `Header` ➜ `SearchBar` уже пишет `searchQuery` и `selectedTags` в Zustand (см. SearchBar.js).
2. `useFavouriteLocations` принимает эти параметры, сервер‑фильтрует по `ILIKE %query%` и `tag_ids IN (…)` — логика аналогична `useLocations` (см. StateManagement‑BatumiTrip.md § React Query).
3. При каждом изменении фильтров карта пересчитывает активные маркеры без перезагрузки тайлов.

---
## 7. Управление состоянием и кешем
| Шаг            | Механизм                                     | Деталь                                                                                                                    |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Загрузка точек | `useQuery(['favourites', uid, filters])`     | `staleTime: 60 s` как у детальной страницы.                                                                               |
| Кеш‑инвалидция | `useToggleFavourite`, `useUpdateLocation`    | После мутации — `invalidateQueries(['favourites', uid])` и локальный optimistic toggle (см. hooks/useToggleFavourite.js). |
| Глобальный UI  | Zustand persistor (`batumi-ui` localStorage) | Карта всегда отображает актуальные фавориты, даже offline.                                                                |

---
## 8. Доступность и UX
* Чёткий **фокус** на поп‑апе и кнопке «Закрыть»; навигация по Tab‑индексу (см. Leaflet accessibility doc).
* Атрибуция OSM / Carto выводится в левом‑нижнем углу `<AttributionControl>`; класс `text-xs opacity-80`.
* Mobile‑first CSS через Tailwind: высота `h-[calc(100vh-theme(spacing.16))]` с учётом фиксированного `Header`.

---
## 9. Производительность и безопасность
* В текущих ограничениях (≤ 60 markers) карта рендерится без лагов; при дальнейшем росте активируется Canvas‑рендер или **virtual‑scroller** для pop‑апов.
* Число одновременных обращений к `tile.openstreetmap.org` ограничено до 4 (Leaflet сам шардирует) — соответствует политике OSM ™ servers.
* Не хранить приватные ключи в репозитории; Carto Dark Matter не требует ключа, но если будет Mapbox, вынести token в ENV.

---
## 10. Тестирование и поддержка
| Тип теста       | Инструмент                           | Цель                                                                                              |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Unit            | Vitest / React Testing Library       | Проверить, что `LocationMap` скрывает маркеры без координат и корректно формирует `LatLngBounds`. |
| E2E             | Cypress + Playwright‑mobile viewport | Клик по поп‑апу открывает `LocationDetailPage`, фильтр по тегу скрывает ненужные маркеры.         |
| Lighthouse a11y | CLI                                  | Контраст, фокус‑кольца, alt‑текст.                                                                |

---
**Новая функция:** интерактивная карта избранных локаций

---

## 0. Изменения в сравнении с версией v0.9 (апрель 2025)

| Категория            | Было                                           | Стало / правка                                                                                |
| -------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Модель данных**    | Таблица `locations` **не содержала** координат | Добавлены столбцы `lat NUMERIC(9,6)`, `lng NUMERIC(9,6)` + GIST‑индекс `idx_locations_coord`. |
| **Edge Function**    | `geocode()` писала адрес только в `address`    | Функция обновлена → возвращает `{ lat, lng }` и пишет в новые поля.                           |
| **React Query**      | Не было хука для избранных локаций             | Новый хук `useFavouriteLocations()` = `useQuery(['favourites', uid, filters])`.               |
| **Zustand**          | Уже имелся `showOnlyFavourites`                | **Без изменений** — карта читает этот флаг для фильтра маркеров.                              |
| **Роутинг**          | `/profile/*` отсутствовал                      | Добавлена страница **`/profile/map`** (App Router) с ленивой загрузкой Leaflet.               |
| **Комп. библиотека** | Leaflet не использовался                       | Теперь в `components/LocationMap.jsx`; динамический `import('leaflet')` для SSR.              |

> **Совместимость:** правки **не** ломающие — все существующие страницы, хуки и RLS остаются прежними. Новые колонки `lat/lng` nullable, поэтому старые записи продолжают работать.

---

## 1. Цель и пользовательская история

> «Как пользователь, я хочу открыть отдельную страницу и увидеть на карте все локации, которые я пометил ⭐ избранным, чтобы быстро представить географию поездки» (UserStory‑BatumiTrip.md story 7).

* **Ограничение бизнес‑ТЗ:** ≤ 60 маркеров одновременно.
* **Темизация:** полная поддержка Dark Theme (см. StyleGuide § 2) — карт‑тайлы переключаются автоматически.

---

## 2. Данные и геокодинг

### 2.1 Новые столбцы в `locations`

```sql
alter table public.locations
  add column if not exists lat numeric(9,6),
  add column if not exists lng numeric(9,6);
create index if not exists idx_locations_coord on public.locations using gist (
  public.ll_to_earth(lat,lng)
);
```

*GIST индекс ускоряет поиск «точек в радиусе» на будущее (кластеризация, маршруты).*

### 2.2 Обновлённая Edge Function `geocode()`

```ts
return {
  address,              // нормализованная строка
  lat: result.lat,      // numeric(9,6)
  lng: result.lng,
};
```

Функция вызывается из `useAddLocation` и `useUpdateLocation`. При ошибке геокодера `lat/lng = null` — карта такие записи игнорирует.

### 2.3 Запрос данных для карты

```sql
select l.id, l.title, l.lat, l.lng
from public.locations l
join public.favourites f using (location_id)
where f.user_id = :uid
  and l.lat is not null and l.lng is not null
  -- фильтры
  and ( :searchQuery is null or l.title ilike '%'||:searchQuery||'%' )
  and ( :tagIds     is null or exists (
        select 1 from public.locations_tags lt
        where lt.location_id = l.id and lt.tag_id = any(:tagIds) ) );
```

---
## 3. Архитектура фронтенда

### 3.1 Файловая структура

```text
components/
└─ LocationMap.jsx        # визуализация Leaflet
app/profile/
  ├─ layout.jsx           # опционально: sticky Header для всех /profile/* страниц
  └─ map/page.jsx         # маршрут карты
hooks/
└─ useFavouriteLocations.js
```

### 3.2 Новый React Query хук
```js
export function useFavouriteLocations(filters){
  const { user } = useAuth();
  return useQuery({
    queryKey: ['favourites', user?.id, filters],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: fetcher
  });
}
```
`fetcher` — SQL‑выше через JS‑SDK. Возвращает `[{ id,title,lat,lng }]` (≤60).

### 3.3 Компонент `LocationMap`
| Под‑блок              | Ответственность                                             |
| --------------------- | ----------------------------------------------------------- |
| `MapContainer`        | Инициализация Leaflet (lazy import); `preferCanvas` = true. |
| `TileLayer`           | `OSM` или Carto Dark Matter в зависимости от `theme`.       |
| `MarkerClusterGroup?` | Подключается, **если** `points.length > 30`.                |
| `Marker` + `Popup`    | SVG `<Star>` внутри `DivIcon`; popup → `<Link>` на деталь.  |
| Zustand‑selector      | `searchQuery`, `selectedTags`, `showOnlyFavourites`.        |
*SSR‑friendly*: `LocationMap` оборачивается в `dynamic(() => import(...), { ssr:false })` в page.js.

### 3.4 Страница `/profile/map/page.jsx`
```jsx
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import TagsPrefetcher from '@/lib/TagsPrefetcher';
const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

export default function MapPage(){
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <TagsPrefetcher />
      <Header />
      <LocationMap />
    </main>
  );
}
```

---
## 4. UI / UX детали
* **Tile URLs**
  *Light*: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
  *Dark*:  `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
* **Атрибуция** — `© OpenStreetMap contributors, © Carto` (Tailwind `text-xs opacity‑80`).
* **Popup** — `role="dialog"`, фокус ловится на `<a>` внутри.
* **Mobile**: `zoomControl=false`, `scrollWheelZoom=false`, высота `h-[calc(100vh-theme(spacing.16))]`.

---
## 5. Производительность и безопасность
* 60 маркеров → без лагов на Canvas render.
* Порог для ленивой подгрузки кластера = >30.
* `import('leaflet.markercluster')` делается внутри `useEffect`, чтобы отложить 180 KB.
* Запрос данных выполняется 1 раз, потом обновляется только при `toggleFavourite`, `updateLocation` или изменении фильтров.

---
## 6. Тесты покрытия
| Уровень | Инструмент | Проверка                                                                                 |
| ------- | ---------- | ---------------------------------------------------------------------------------------- |
| Unit    | Vitest     | `fitBounds` корректно охватывает все точки; скрытие `null` coords.                       |
| E2E     | Cypress    | Нажатие на маркер → редирект на `/locations/[id]`; фильтр тегов прячет/показывает точки. |
| a11y    | Lighthouse | Контраст поп‑апа, фокус‑кольца, alt‑тексты и aria‑roles.                                 |
