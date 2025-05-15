# API‑NewMainPage
> **Релиз**: *Destination Branches* | **Дата**: 15 мая 2025 | **Back‑end**: Supabase (PostgREST + RPC) | **Front‑end**: Next.js (App Router 13.x) | **Auth**: NextAuth.js (JWT strategy)

---
## 1. Назначение документа
Данный документ описывает **API‑контур** для внедрения мульти‑направлений в Batumi Trip. Включены:

* клиентские маршруты **App Router**;
* **Supabase REST**‑эндпоинты для чтения данных;
* **RPC‑процедуры** для мутаций (добавление / обновление / удаление);
* схема аутентификации и **защиты маршрутов** через *NextAuth.js* + `middleware.ts`.

Спецификация согласована с:
* *Architecture‑NewMainPage.md* (в/у‑архитектура);
* *DataModel‑NewMainPage.md* (ER‑модель, миграции);
* *ExistComponents.md* (актуальный код).

---
## 2. Клиентские маршруты (Next.js App Router)

| Путь                                          | HTTP | Компонент              | Доступ      | Назначение                                       |
| --------------------------------------------- | ---- | ---------------------- | ----------- | ------------------------------------------------ |
| `/`                                           | GET  | `DestinationHubPage`   | public      | Хаб направлений (список `directions`).           |
| `/destination/[dirId]`                        | GET  | `LocationListPage`     | public      | Локации выбранного направления (`direction_id`). |
| `/destination/[dirId]/locations/new`          | GET  | `AddLocationPage`      | **private** | Форма создания локации внутри ветки.             |
| `/destination/[dirId]/locations/[locId]`      | GET  | `LocationDetailPage`   | public      | Детальный просмотр локации.                      |
| `/destination/[dirId]/locations/[locId]/edit` | GET  | `LocationForm` (edit)  | **private** | Редактирование локации.                          |
| `/api/auth/[...nextauth]`                     | ALL  | NextAuth route handler | public      | Логин / logout / callback.                       |

> **Навигация**: переходы выполняются через `router.push()`; состояние активного направления хранится в `uiStore.activeDirectionId`.

---
## 3. Supabase REST (v1)

### 3.1. directions

* **GET** `/rest/v1/directions?user_id=eq.{uid}&order=created_at.desc`
  *Ответ*: `[{ id, title, country, city, cover_url, created_at }]`
* **Не рекомендуется** использовать прямые POST/PATCH/DELETE — вместо них вызовите RPC‑функции (см. § 4).

### 3.2. locations (c фильтром ветки)
```http
GET /rest/v1/locations
  ?direction_id=eq.{dirId}
  &order=created_at.desc
  &limit=9
  &select=*,locations_tags(tag_id,tags(name)),favourites!left(user_id)
```

`locations_tags` + `tags` дают массив тегов; `favourites` используется для вычисления `isFavourite`.

### 3.3. tags / locations\_tags / favourites
| Таблица          | Основные операции                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `tags`           | `GET /rest/v1/tags?order=name` — справочник; `POST` от формы `ChooseTag` (добавить новый тег).                                   |
| `locations_tags` | Не вызывается напрямую; поддерживается внутри RPC‑функций.                                                                       |
| `favourites`     | ⭐ `POST /rest/v1/favourites` \| `DELETE /rest/v1/favourites?user_id=eq.{uid}&location_id=eq.{locId}` (см. `useToggleFavourite`). |

> **Пагинация** реализована cursor‑подходом: параметр `created_at` предыдущей страницы передаётся как `lt(created_at)`.

---
## 4. RPC‑процедуры (Postgres → PostgREST `/rest/v1/rpc/...`)
| Имя                         | Сигнатура                                                                                                                                                                    | Использует хук       | Назначение                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------- |
| `add_direction`             | `(p_user_id TEXT, p_title TEXT, p_country TEXT, p_city TEXT DEFAULT NULL, p_cover_url TEXT DEFAULT NULL) RETURNS directions`                                                 | `useAddDirection`    | Создать новое направление.                            |
| `update_direction`          | `(p_user_id TEXT, p_direction_id UUID, p_title TEXT DEFAULT NULL, …) RETURNS directions`                                                                                     | `useUpdateDirection` | Изменить направление.                                 |
| `delete_direction`          | `(p_user_id TEXT, p_direction_id UUID) RETURNS void`                                                                                                                         | `useDeleteDirection` | Каскадно удалить направление и все связанные локации. |
| `create_location_with_tags` | `(p_user_id TEXT, p_title TEXT, p_description TEXT, p_address TEXT, p_cost TEXT, p_source_url TEXT, p_image_url TEXT, p_tags TEXT[], p_direction_id UUID) RETURNS locations` | `useAddLocation`     | Создать локацию с тегами внутри ветки.                |
| `update_location_with_tags` | `(p_loc_id UUID, …, p_tags TEXT[]) RETURNS locations`                                                                                                                        | `useUpdateLocation`  | Обновить локацию (+ замена изображения).              |
| `delete_location`           | `(location_id UUID) RETURNS void`                                                                                                                                            | `useDeleteLocation`  | Каскадно удалить локацию.                             |

### Пример вызова `add_direction`
```bash
curl -X POST \
  'https://<project>.supabase.co/rest/v1/rpc/add_direction' \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{
    "p_user_id": "alice",
    "p_title": "Италия 2025",
    "p_country": "Italy",
    "p_city": "Rome",
    "p_cover_url": "https://…/rome.jpg"
  }'
```

> **Безопасность**: все функции объявлены `SECURITY DEFINER` и внутри сравнивают `p_user_id` c `auth.uid()` (см. миграции).

---
## 5. Аутентификация (NextAuth.js Credentials)
* **Эндпоинт**: `/api/auth/[...nextauth]` (см. `route.js`).
* **Стратегия**: JWT, срок жизни 30 дней (`session.maxAge`).
* **Authorize**: первый вход делает `upsert` в таблице `users`.
* **Токен в SSR**: извлекается через `getToken()` (используется в `middleware.ts`).
* **Хук** `useAuth()` предоставляет `{ user, isLoading, signIn, signOut }`.

---
## 6. Защита маршрутов (`middleware.ts`)
```ts
export const config = {
  matcher: [
    '/destination/(.*)/locations/new',   // создание локации
    '/destination/(.*)/locations/(.*)/edit',
    '/locations/new',                    // fallback старого пути
  ],
};
```
Алгоритм:
1. Разрешить публичные страницы (`/`, `/destination/*`, статика).
2. Проверить наличие валидного JWT‑cookie.
3. Если токен отсутствует → `redirect('/')` (логин‑модалка).

> Защита выполняется **на уровне edge‑middleware**; дополнительно, в компонентах мутаций проверка `useAuth().user` блокирует операции для гостей.

---
## 7. Сопоставление React‑Query хуков ↔ API
| Хук                  | REST                        | RPC                           | Аутентификация         |
| -------------------- | --------------------------- | ----------------------------- | ---------------------- |
| `useDirections`      | ✔ GET `/directions`         | —                             | не требует (public)    |
| `useAddDirection`    | —                           | ✔ `add_direction`             | **нужен** JWT          |
| `useUpdateDirection` | —                           | ✔ `update_direction`          | **нужен**              |
| `useDeleteDirection` | —                           | ✔ `delete_direction`          | **нужен**              |
| `useLocations`       | ✔ GET `/locations`          | —                             | public                 |
| `useAddLocation`     | —                           | ✔ `create_location_with_tags` | **нужен**              |
| `useUpdateLocation`  | —                           | ✔ `update_location_with_tags` | **нужен**              |
| `useDeleteLocation`  | —                           | ✔ `delete_location`           | **нужен**              |
| `useTags`            | ✔ GET `/tags`               | —                             | public                 |
| `useToggleFavourite` | ✔ POST/DELETE `/favourites` | —                             | **нужен** (авто‑login) |

---
## 8. Форматы ответов

### 8.1. directions (REST)
```json
[
  {
    "id": "8cfccd1b-6b42-46e6-914d-1ff3f9f3ac71",
    "user_id": "alice",
    "title": "Road‑trip Spain",
    "country": "Spain",
    "city": "Barcelona",
    "cover_url": "https://…/cover.jpg",
    "created_at": "2025-05-15T10:00:00Z"
  }
]
```

### 8.2. locations (JOIN)
```json
{
  "id": "2e1c…",
  "direction_id": "8cfccd1b…",
  "title": "Sagrada Família",
  "description": "Базилика архитектора Антонио Гауди…",
  "image_url": "https://…/sf.jpg",
  "tags": ["architecture", "must‑see"],
  "isFavourite": true
}
```

---
## 9. Политика ошибок
| Код                | Сценарий                         | Ответ                               |
| ------------------ | -------------------------------- | ----------------------------------- |
| `401 Unauthorized` | Отсутствует или просрочен JWT    | `{ "message": "auth‑required" }`    |
| `403 Forbidden`    | Попытка модификации чужих данных | `{ "message": "access‑denied" }`    |
| `400 Bad Request`  | Неверные аргументы RPC           | `{ "message": "validation‑error" }` |
| `500 Internal`     | Ошибка сервера / storage         | `{ "message": "server‑error" }`     |

Ошибки проксируются в React‑Query хуки и отображаются через `toast`.

---
## 10. Версионирование и расширяемость
* Все REST‑запросы используют `accept-profile="public"`; миграции БД — SQL‑файлы с датой `YYYYMMDD`.
* RPC‑функции версионируются через добавление суффикса `_v2` при ломаюших изменениях.
* При дальнейшем расширении страниц ветки (`/destination/{id}`) ограничения `middleware.matcher` нужно синхронизировать.

---
