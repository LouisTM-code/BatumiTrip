# Архитектура компонентов (Component Design) — Batumi Trip

## Иерархия компонентов
* **Layout** (глобальный макет)
  ├─ **Header** (навигационная панель с логотипом/названием и кнопкой авторизации)
  ├─ **LoginModal** (всплывающее окно авторизации)
  ├─ **Основная часть страницы (Main Content)**
      ├─ **LocationListPage** (главная страница со списком локаций и поиском)
      │    ├─ **SearchBar** (компонент поиска по заголовку и тегу)
      │    ├─ **AddLocationButton** (кнопка перехода к форме добавления локации)
      │    └─ **LocationList** (контейнер для списка карточек локаций)
      │        ├─ **LocationCard** (карточка локации для каждой записи)
      │        │  └─ **TagBadge** (отдельный компонент для отображения тега внутри карточки)
      │        └─ **SkeletonCard** (скелетон-заглушка при загрузке списка)
      ├─ **LocationDetailPage** (страница детальной информации о выбранной локации)
      │    ├─ **LocationDetail** (компонент отображения полной информации локации)
      │    │  └─ **TagBadge** (список тегов локации)
      │    ├─ **EditButton** (кнопка редактирования локации)
      │    └─ **DeleteButton** (кнопка удаления локации)
      └─ **AddLocationPage** (страница формы добавления локации)
          └─ **LocationForm** (компонент формы для создания/редактирования локации)

---
## Описание компонентов в очереди на раелизацию (Актуальный код: *ещё не рализован*)

### LocationDetailPage (Страница подробной информации)

* **Назначение:** Страница с полным описанием выбранной локации.
* **Пропсы:** Параметр `id` из маршрута (Next.js Dynamic Route).
* **Взаимодействие:** При получении параметра `id` вызывает `useOneLocation(id)` `(useQuery(['location', id]))` для загрузки объекта; данные передаёт в `LocationDetail`. Кнопки `EditButton` и `DeleteButton` используют хуки `useUpdateLocation()` и `useDeleteLocation()` соответственно.
* **Используемые библиотеки:** React Query (`useQuery` для получения одной локации), Tailwind для разметки, shadcn (`Button`), Framer Motion (необязательно для плавного появления контента).
**Актаульный код LocationDetailPage:** *Ещё не рализован*

### LocationDetail

* **Назначение:** Компонент отображения подробных данных локации (используется на `LocationDetailPage`).
* **Пропсы:**

  * `title: string`
  * `description: string`
  * `imageUrl: string`
  * `address: string`
  * `cost: string`
  * `sourceUrl: string`
  * `tags: string[]`
* **Взаимодействие:** Показывает большие изображение и все текстовые поля локации. Теги выводит через `TagBadge`. Кнопки `EditButton` и `DeleteButton` (связанные с тем же `id`) располагаются рядом. Адрес можно сделать кликабельным (ссылка на Google Maps), `sourceUrl` — внешний ресурс.
* **Используемые библиотеки:** Tailwind (верстка), shadcn (возможные компоненты `Card`, `Image`), Framer Motion для плавного анимационного эффекта при появлении страницы.
**Актаульный код LocationDetail:** *Ещё не рализован*

### EditButton

* **Назначение:** Кнопка для перехода к форме редактирования текущей локации.
* **Пропсы:** `locationId: string`
* **Взаимодействие:** При клике вызывает `router.push('/locations/${locationId}/edit')` (если есть отдельный маршрут редактирования) или открывает `LocationForm` с начальной функцией. Может быть реализована как ссылка.
* **Используемые библиотеки:** shadcn (`Button`), Tailwind.
**Актаульный код EditButton:** *Ещё не рализован*

### DeleteButton

* **Назначение:** Кнопка для удаления текущей локации.
* **Пропсы:** `locationId: string`, `onDeleted?: () => void` (коллбэк после успешного удаления).
* **Взаимодействие:** При нажатии запрашивает подтверждение удаления (например, через браузерное `confirm` или дополнительный модальный диалог). После подтверждения вызывает API (через React Query `useMutation` или Supabase SDK) метод удаления записи из таблицы `locations`. По успешному удалению вызывает `onDeleted` (обычно перенаправляет на главную страницу).
* **Используемые библиотеки:** shadcn (`Button`), Tailwind, React Query для мутации.
**Актаульный код DeleteButton:** *Ещё не рализован*

---
## Пользовательские хуки и глобальное состояние

### useOneLocation.js

* **Назначение:** Кастомный хук для загрузки одной локации по `id` вместе с привязанными тегами и признаком «избранное» для текущего пользователя.
* **Функционал:** 
  * Оборачивает `useQuery(['location', id], fetcher`, `{ staleTime: 60_000 }).`
  * fetcher делает запрос к Supabase REST:
  `GET /rest/v1/locations?id=eq.{id}&select=*,tags(*),favourites(user_id)&limit=1.`
  * В респонсе вычисляет `isFavourite = favourites.length > 0.`
  * При ошибке — выводит `toast` через `react-hot-toast`.
* **Использование:** Применяется в `LocationDetailPage`, `LocationForm` (режим Edit) и в модалке быстрого предпросмотра.
**Актаульный код useOneLocation.js:** *Ещё не рализован*

### useUpdateLocation

* **Назначение:** Мутация для обновления существующей локации.
* **Функционал:**
  * `useMutation(({ id, ...patch }) => PATCH /rest/v1/locations?id=eq.{id}).`
  * При обновлении тегов вызывает RPC `sync_location_tags(location_id, tag_ids[])`.
  * Инвалидирует `['location', id]` и `['locations']`. 
* **Использование:** Кнопка `Save` в `LocationForm` (режим Edit) и `EditButton` на детальной странице.
**Актаульный код useUpdateLocation:** *Ещё не рализован*

### useDeleteLocation

* **Назначение:** Мутация для удаления локации.
* **Функционал:**
  * `useMutation(id => DELETE /rest/v1/locations?id=eq.{id})`.
  * Удаляет связанные избранные: `DELETE /rest/v1/favourites?location_id=eq.{id}`.
  * Инвалидирует `['locations']`, `['favourites', userId]` и очищает `favorites` в Zustand.
* **Использование:** `DeleteButton` на `LocationDetailPage`; после успеха выполняет `router.push('/')`.
**Актаульный код useDeleteLocation:** *Ещё не рализован*

### useToggleFavourite

* **Назначение:** Мутация‑переключатель «добавить / удалить в избранное» для текущего пользователя.
* **Функционал:**
  * Если локация не любима → `POST /rest/v1/favourites { user_id, location_id }`.
  * Иначе → `DELETE /rest/v1/favourites?user_id=eq.{uid}&location_id=eq.{id}`.
  * Оптимистично обновляет `favorites` в Zustand (`toggleFavorite(id)`) и инвалидирует `['favourites', userId]`, `['location', id]`, `['locations']`.
* **Использование:** Вызывается внутри LocationCard при клике на иконку избранное⭐
**Актаульный код useToggleFavourite:** *Ещё не рализован*

> **Библиотеки для UI и анимаций:** Все компоненты стилизуются с помощью Tailwind CSS. Для унифицированного дизайна используются готовые элементы из библиотеки shadcn (Buttons, Inputs, Cards, Modal, Form). Анимации при появлении элементов (загрузка, переходы, появление карточек) реализуются через Framer Motion (например, `motion.div` для плавного фейда или анимирования Skeleton-эффекта).

---