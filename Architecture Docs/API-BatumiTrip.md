# API‑Batumi Trip

> SPA = Next.js (13 app router) + Supabase (PostgreSQL + Storage).
> Все примеры URL приведены относительно
> `https://<PROJECT>.supabase.co/rest/v1` и `https://<APP‑DOMAIN>`.

---
## Next.js API Routes
| Route                     | Методы        | Назначение                                                 |
| ------------------------- | ------------- | ---------------------------------------------------------- |
| `/api/auth/[...nextauth]` | `GET`, `POST` | Password‑less логин (Credentials provider) и JWT‑сессии.   |

**Особенности**
* **Strategy = `jwt`**, срок действия — 30 дней.
* При `authorize()` логин (строка `^[A‑Za‑zА‑Яа‑я]{3,32}$`) апсёртится в таблицу `users`.&#x20;
* Коллбэк `jwt` кладёт `token.id`, а `session` отдаёт его как `session.user.id`, чтобы RLS‑политики Supabase могли сравнивать `auth.uid()` с полем `user_id`.

> На данный момент других маршрутов в `/app/api` нет — вся CRUD‑логика уходит напрямую в Supabase через JS SDK.

---
## Supabase REST API 

### Базовая информация
* **Анонимный ключ** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) используется во фронтенде.
* Все запросы формируются через клиент `@supabase/supabase-js`; в примерах ниже показаны «сырые» HTTP‑пути для PostgREST.
* Формат ответа — JSON массива / объекта.
* Пагинация: `range=<from>,<to>` или курсоры (см. ниже).

### Таблицы
| Таблица          | Полные права                                                          | Главные колонки                                                                                                    |
| ---------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `users`          | `SELECT`,`INSERT`,`UPDATE`,`DELETE self`                              | `id`, `created_at`, `updated_at`                                                                                   |
| `locations`      | `SELECT` (всем), `INSERT/UPDATE/DELETE` (всем, пока проект маленький) | `id`, `user_id`, `title`, `description`, `image_url`, `address`, `cost`, `source_url`, `created_at`, `updated_at`  |
| `tags`           | `SELECT`,`INSERT`                                                     | `id`, `name`                                                                                                       |
| `locations_tags` | `SELECT`, `INSERT/DELETE` (только владелец локации)                   |                                                                                                                    |
| `favourites`     | `SELECT`, `INSERT`, `DELETE`                                          |                                                                                                                    |

> RLS политики подробно описаны в модели данных — § 5 DataModel‑BatumiTrip.md .

#### Примеры запросов

* **Список последних локаций**
  `GET /locations?order=created_at.desc&limit=9`
* **Поиск** по заголовку (ILIKE + `pg_trgm`)
  `GET /locations?title=ilike.*%Dancing%20Tree*`
* **Получить локацию с тегами и флагом избранного**
```
GET /locations?
  id=eq.{location_id}&
  select=*,
         tags:locations_tags(tag_id,tag:tags(name)),
         isFavourite:favourites!left(user_id)
```

* **Добавить в избранное**
  `POST /favourites { "user_id":"alice","location_id":"…uuid…" }`

---
## Supabase RPC‑функции (Stored Procedures)
| Имя                         | Параметры                                              | Возврат     | Краткое описание                                                                       |
| --------------------------- | ------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------- |
| `add_location_tag`          | `location_id uuid`, `tag_id uuid`                      | `void`      | Служебная вставка связки `location‑tag`.                                               |
| `create_location_with_tags` | `p_user_id text`, `p_title text`, `…`, `p_tags text[]` | `locations` | Транзакционно создаёт локацию, новые теги (если нужно) и заполняет `locations_tags`.   |
| `update_location_with_tags` | `p_loc_id uuid`, `…`, `p_tags text[]`                  | `locations` | Обновляет запись и полностью пересобирает её тег‑связи.                                |
| `delete_location`           | `location_id uuid`                                     | `void`      | Каскадно удаляет локацию и её связи; изображение очищается на клиенте.                 |
| `trigger_set_timestamp`\*   | ‑                                                      | `trigger`   | Служебный триггер для `updated_at`; вызывается из DDL.                                 |

\* вызвается системой, ручной RPC‑доступ не предполагается.

---
## Аутентификация и Сессии  <a id="аутентификация-и-сессии"></a>
| Уровень  | Технология                             | Детали                                                                                                                                                                             |
| -------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Фронтенд | **NextAuth.js v5‑beta** (credentials)  | Один ввод — `username` (3‑32 символа, буквы‑A/Я), без пароля.                                                                                                                      |
| Бэкенд   | **Supabase RLS**                       | Политики допускают анонимные запросы, но insert / delete в некоторых таблицах ссылаются на `auth.uid()`. При вызове RPC функции идут с SECURITY DEFINER, поэтому работают без JWT. |
| Сессия   | JWT в cookie `next-auth.session-token` | `sub` и `id` → `username`; передаётся внутрь React Query хуков через `useSession()`.                                                                                               |
| Storage  | Supabase Bucket `images`               | Путь `{user_id}/{timestamp‑rand}.{ext}`; загрузка через утилиту `uploadImage`, удаление через `deleteImage`.                                                                       |

Диаграмма потока входа:
```
User → LoginModal → signIn('credentials')
  ⇢ NextAuth authorize() → upsert users(id)
  ⇢ NextAuth returns JWT → browser cookie
  ⇢ Front‑end Supabase client initialized (no auth header)
     ↳ RPC‑функции выполняются с definer‑привилегиями
```

---
## Конвенция наименования полей
| Слой             | Стиль                                                                                         | Пример                               |
| ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| База данных      | `snake_case`, **ед. число**, `timestamp` поля `*_at`, внешние ключи `*_id`, URL‑поля `*_url`. | `image_url`, `user_id`, `created_at` |
| Supabase REST    | те же snake‑case ключи, колонка‑как‑поле                                                      | `locations.image_url`                |
| JS hooks / React | camelCase для переменных и пропов; ответы PostgREST не мапятся (используются как есть).       | `const { image_url } = row`          |
| RPC              | Параметры с префиксом `p_…` для сложных функций.                                              | `p_user_id`, `p_tags`                |

---
## Дополнения

### Пагинация / бесконечный скролл
`useLocations` запрашивает по 9 записей, сортировка `created_at.desc`, курсор — `lt('created_at', lastCursor)`; индексы `idx_locations_title_trgm`, `idx_locations_user`.&#x20;

### Коды ошибок
| Код           | Где      | Когда                                                                                         |
| ------------- | -------- | --------------------------------------------------------------------------------------------- |
| `23505`       | Supabase | конфликт `unique` (тег уже есть) — перехватывается в `ChooseTag`.                             |
| `42501`       | Supabase | RLS forbid — сейчас встречается только если владелец пытается задать чужой тег‑связь вручную. |
| `401` / `403` | NextAuth | истёк JWT или невалидный логин.                                                               |

### Хранимые файлы и лимиты
* Размер изображения ≤ 5 MB, тип `image/*`.
* В Production‑bucket настроен публичный доступ (Storage policy “public read”).

---