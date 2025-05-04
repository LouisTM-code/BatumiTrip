# Архитектура API — Batumi Trip

---
## Next.js API Routes (App Router, `app/api/...`)

В проекте используется NextAuth.js с App Router API для аутентификации. Все маршруты аутентификации находятся в `app/api/auth/[...nextauth]/route.js`.

| Метод | Путь | Описание | Параметры/Тело запроса | Структура ответа (успех) | Авторизация |
|-------|------|----------|----------------------- |------------------------- |-------------|
| **POST** | `/api/auth/signin` | Инициация логина через Credentials Provider | Body: `{ "username": string }` | Редирект или JSON сессии (NextAuth) | No (вход) |
|  **GET** | `/api/auth/callback/credentials` | Callback после аутентификации | Query (NextAuth автоматически) | JSON с информацией о сессии (user ID) | No |
|  **GET** | `/api/auth/signout` | Завершение сессии | — | 204 No Content (клика удаляет cookie) | Yes (cookie сессия) |
|  **GET** | `/api/auth/session` | Получение текущей сессии | — | `{ user: { id: string } }` или `{}` | Yes (cookie-session) |

* **Middleware:** В файле `middleware.ts` проверяется наличие HTTP-only куки NextAuth (`next-auth.session-token`). Если куки нет и маршрут закрыт (например, `/locations/...`), происходит редирект на главную страницу или форму логина.
* **Конфигурация NextAuth:** В `lib/auth.js` настраивается провайдер Credentials. JWT-сессия хранит `user.id` (логин). Значение `NEXTAUTH_SECRET` задаётся через переменные окружения. HTTP-only кука действует по всему домену.

---
## Supabase REST API

Каждая таблица базы Supabase имеет свой REST-эндерпоинт в формате `/rest/v1/{table}`. Аутентификация клиентов через сервис-ключ и RLS-правила, которые ограничивают данные текущим пользователем (`user_id` фильтруется по сессии).

### Таблица `users`

| Метод | Путь | Описание | Body / Query | Ответ (успех) | Авторизация |
|-------|------|----------|--------------|---------------|-------------|
| GET | `/rest/v1/users` | Список пользователей (технически не нужен) | - | `[{ id: string, created_at: timestamp, updated_at: timestamp }]` | Да (сервис-ключ + RLS) |
| GET | `/rest/v1/users?id=eq.{id}` | Получить конкретного пользователя | Query Param `id` | `{ id: string, created_at: timestamp, updated_at: timestamp }` | Да |
| POST | `/rest/v1/users` | Создать нового пользователя | Body: `{ id: string }` (только id, остальное авто) | `{ id: string, created_at: timestamp, updated_at: timestamp }` | Нет (указывать текущий) |
| PATCH | `/rest/v1/users?id=eq.{id}` | Обновить пользователя (редко) | Body: `{ updated_at: timestamp }` | `{}` | Да |
| DELETE | `/rest/v1/users?id=eq.{id}` | Удалить пользователя | - | `{}` | Да |

* **Структура `users`:** `{ id (PK, логин), created_at, updated_at }`. При первом логине добавляется новая запись.
* **Ошибки:** 401 при отсутствующей авторизации или 403 при нарушении RLS.

### Таблица `locations`

| Метод | Путь | Описание | Body / Query | Ответ (успех) | Авторизация |
|-------|------|----------|--------------|---------------|-------------|
| GET | `/rest/v1/locations?select=*` | Список всех локаций пользователя | Может быть `limit`, `offset`, `user_id=eq.{id}` (RLS) | `[{ id, user_id, title, description, image_url, address, cost, source_url, created_at, updated_at }]` | Да (RLS) |
| GET | `/rest/v1/locations?id=eq.{id}` | Получить конкретную локацию по ID | Query Param `id` | `{ id, user_id, title, description, image_url, address, cost, source_url, created_at, updated_at }` | Да |
| POST | `/rest/v1/locations` | Добавить новую локацию | Body: JSON со всеми полями кроме `id`, `created_at`, `updated_at` | `{ id, ...поля..., created_at, updated_at }` | Да |
| PATCH | `/rest/v1/locations?id=eq.{id}` | Обновить локацию | Body: поля для обновления (например, `{ title: string, ... }`) | `{}` или обновленный объект | Да |
| DELETE | `/rest/v1/locations?id=eq.{id}` | Удалить локацию | - | `{}` | Да |

**Фильтрация и поиск локаций:** В этоЙ таблицие описаны параметры запроса к `/rest/v1/locations` для реализации поиска по названию и фильтрации по тегам.

| Параметр запроса | Описание | Пример |
|------------------|----------|--------|
| `title=ilike.*{substring}*` | Поиск по подстроке в названии (регистронезависимо) | `?title=ilike.*cafe*` |
| `locations_tags.tag_id=eq.{id}` | Фильтрация по идентификатору тега через связь `locations_tags` | `?select=*,locations_tags(tag_id)&locations_tags.tag_id=eq.123` |
| Комбинация | Одновременный поиск по названию и фильтрация по тегу | `?title=ilike.*bar*&select=*,locations_tags(tag_id)&locations_tags.tag_id=eq.456` |

> Параметры используют PostgREST convention для ilike и join. Frontend-утилита автоматически добавляет `select=*` при необходимости.

**Примечания:**
* RLS-политика в Supabase гарантирует, что запросы `/locations` возвращают только локации текущего пользователя (`user_id` совпадает с id из сессии).
* Ответы по GET запросам возвращают JSON-массив или объект с полями, соответствующими таблице `locations`.
* Пример схемы ответа (JSON):
  ```json
  {
    "id": "b1a2c3d4-5678-90ef-gh12-ijklmnopqrst",
    "user_id": "user123",
    "title": "Кафе у моря",
    "description": "Уютное место с видом на порт.",
    "image_url": "https://example.com/image.jpg",
    "address": "Batumi, Shevardnadze Ave, 10",
    "cost": "20 GEL",
    "source_url": "https://instagram.com/...",
    "created_at": "2025-05-01T12:34:56Z",
    "updated_at": "2025-05-02T09:10:11Z"
  }
  ```

### Таблица `tags`

| Метод | Путь | Описание | Body / Query | Ответ (успех) | Авторизация |
|-------|------|----------|--------------|---------------|-------------|
| GET | `/rest/v1/tags?select=*` | Список всех тегов | - | `[{ id, name }]` | Нет (общий список) |
| GET | `/rest/v1/tags?id=eq.{id}` | Получить тег по ID | Query Param `id` | `{ id, name }` | Нет |
| POST | `/rest/v1/tags` | Создать новый тег | Body: `{ name: string }` | `{ id, name }` | Да (или при добавлении локации) |
| PATCH | `/rest/v1/tags?id=eq.{id}` | Переименовать тег | Body: `{ name: string }` | `{}` | Да |
| DELETE | `/rest/v1/tags?id=eq.{id}` | Удалить тег (если не используется) | - | `{}` | Да |

* **Структура `tags`:** `{ id (UUID), name }`. Хранит все возможные теги.
* **Использование:** Теги подтягиваются для формирования фильтра и отображения в карточках.

### Таблица `locations_tags` (связующая)

| Метод | Путь | Описание | Body / Query | Ответ (успех) | Авторизация |
|-------|------|----------|--------------|---------------|-------------|
| GET | `/rest/v1/locations_tags?select=*` | Список всех связей локаций и тегов | Может фильтроваться по `location_id` или `tag_id` | `[{ location_id, tag_id }]` | Нет или Да |
| POST | `/rest/v1/locations_tags` | Связать тег с локацией | Body: `{ location_id: UUID, tag_id: UUID }` | `{ location_id, tag_id }` | Да (RLS) |
| DELETE | `/rest/v1/locations_tags?location_id=eq.{locId}&tag_id=eq.{tagId}` | Удалить связь | - | `{}` | Да |

* **Контекст:** Используется при добавлении или удалении тега в карточке локации. Часто операцию делают через RPC (см. ниже), но можно через прямые REST-вызовы.

---
## Supabase RPC-функции (Stored Procedures)
> (Название функций условное — должно быть задано в базе заранее. Ниже приведена предсказательная спецификация.)

| Название RPC-функции | Метод | Параметры (JSON) | Возвращает | Описание |
|----------------------|-------|------------------|------------|----------|
| `add_location_tag` | POST | `{ "location_id": UUID, "tag_id": UUID }` | `{ success: boolean }` | Добавляет запись в `locations_tags`. |
| `remove_location_tag` | POST | `{ "location_id": UUID, "tag_id": UUID }` | `{ success: boolean }` | Удаляет запись из `locations_tags`. |
| `create_location` | POST | `{ "user_id": string, "title": text, ... }` | `{ id: UUID }` | Создает новую локацию (вместо прямого POST /locations) |
| `update_location` | POST | `{ "location_id": UUID, "title": text, ... }` | `{ success: boolean }` | Обновляет поля локации (вместо прямого PATCH). |
| `delete_location` | POST | `{ "location_id": UUID }` | `{ success: boolean }` | Удаляет локацию и связанные теги (Cascade delete). |

* **Примечание:** RPC-функции могут упрощать логику на клиенте. Их использование опционально: некоторые операции можно реализовать через REST API или JavaScript SDK Supabase.

---
## Edge Functions (Serverless)
> Проект содержит пользовательские функции Supabase Edge Functions для дополнительных возможностей:

| URL | Метод | Параметры/Тело | Ответ | Описание |
|-----|-------|----------------|-------|----------|
| `/api/geocode` (EdgeFn) | POST | JSON: `{ "address": string }` | `{ "lat": number, "lon": number }` | Принимает адрес, возвращает координаты (геокодинг). Может вызываться при сохранении локации для определения координат. |
| `/api/webhook` (EdgeFn) | POST  | JSON: `{ ...payload }` | `204 No Content` | Обрабатывает внешние события (например, уведомления или сторонние вебхуки). Логика зависит от интеграции. |

* **Описание:** Edge Function `geocode` использует внешнее API геокодирования (например, Mapbox/Google) и возвращает координаты. Edge Function `webhook` — универсальный приемник вебхуков (например, уведомление о новом событии), логирует или передает данные в бэкэнд.
* **Авторизация:** Если функция предназначена для внутреннего использования, она может требовать API-ключ в заголовке. Либо быть публичной.

---
## Аутентификация и Сессии

* **NextAuth.js (Credentials):** При входе по логину создается JWT-сессия. В настройках NextAuth (`lib/auth.js`) указан провайдер `Credentials` без пароля. При успешной авторизации `user.id` записывается в базу `users` (через callback `signIn`) и в сессии.
* **Cookie-сессия:** NextAuth сохраняет HTTP-only cookie (на клиенте) с названием `next-auth.session-token` (и `next-auth.csrf-token`). В куки хранится токен сессии, который использует `middleware.ts` для проверки доступа. Срок действия — долговременный.
* **Middleware:** Next.js Middleware (файл `middleware.ts`) проверяет наличие валидной сессионной куки перед доступом к защищенным маршрутам (`/locations/*`). Если её нет или она просрочена, происходит редирект на главную `/` или на форму логина.
* **Куки и авторизация:** Все запросы к Supabase из клиента выполняются через Supabase Client SDK, который включает сервисный ключ (или anon key) и поддерживает RLS. Для фронтенда это прозрачно. А для собственных API-методов (RPC/Edge) можно дополнительно передавать user ID из сессии или использовать `getServerSession` (NextAuth) на сервере.

```jsonc
// Пример структуры JSON ответа на авторизацию:
{
  "user": {
    "id": "user123"
  },
  "session": {
    "accessToken": "eyJhbGciOi...",
    "expires": "2025-05-08T12:00:00Z"
  }
}
```

---
## Конвенция наименования полей
> Backend (Supabase) — всегда snake_case (image_url, source_url).
Frontend (TypeScript DTO, React‑props) — camelCase (imageUrl, sourceUrl).
Маппинг выполняется автоматически в fetch‑утилите (/lib/fetchers.ts) с помощью camelcaseKeys() / snakecaseKeys(); при генерации кода ИИ должен учитывать это правило, чтобы типы данных совпадали.

---