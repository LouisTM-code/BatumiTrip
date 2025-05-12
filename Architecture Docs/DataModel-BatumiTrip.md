# Архитектура данных (Data Model) — **Batumi Trip**
> **Назначение:** Документ описывает логическую модель данных SPA‑приложения «Batumi Trip», включая ER‑диаграмму, схемы таблиц, индексы, миграции Supabase (PostgreSQL) и правила Row‑Level Security (RLS). Модель учитывает password‑less аутентификацию, открытый `SELECT` для всех локаций и приватные операции по владельцу.

---
## 1. ER‑диаграмма

```mermaid
erDiagram
    users {
        VARCHAR(50) id PK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    locations {
        UUID id PK
        VARCHAR(50) user_id FK
        TEXT title
        TEXT description
        TEXT image_url
        TEXT address
        TEXT cost
        TEXT source_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    tags {
        UUID id PK
        VARCHAR(50) name
    }
    locations_tags {
        UUID location_id FK
        UUID tag_id FK
    }
    favourites {
        VARCHAR(50) user_id FK
        UUID location_id FK
        TIMESTAMP created_at
    }

    users ||--o{ locations : "owns"
    users ||--o{ favourites : "likes"
    locations ||--o{ locations_tags : "has"
    locations ||--o{ favourites : "is liked"
    tags ||--o{ locations_tags : "tagged"
```

---

## 2. Описание таблиц

### 2.1 `users`

| Поле | Тип | Ключи/DEFAULT | Описание |
|------|-----|---------------|----------|
| `id` | `VARCHAR(50)` | **PK** | Уникальный логин — идентификатор пользователя. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()` | |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()` + триггер | |

### 2.2 `locations`

| Поле | Тип | Ключи/DEFAULT | Описание |
|------|-----|---------------|----------|
| `id` | `UUID` | **PK**, `DEFAULT gen_random_uuid()` | |
| `user_id` | `VARCHAR(50)` | **FK → users.id** | Владелец записи. |
| `title` | `TEXT` | `NOT NULL` | Название локации. |
| `description` | `TEXT` | | Подробное описание. |
| `image_url` | `TEXT` | | Ссылка на изображение. |
| `address` | `TEXT` | | Адрес / координаты. |
| `cost` | `TEXT` | | Стоимость или категория. |
| `source_url` | `TEXT` | | Ссылка на первоисточник. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()` | |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()` + триггер | |

### 2.3 `tags`

| Поле | Тип | Ключи/DEFAULT | Описание |
|------|-----|---------------|----------|
| `id` | `UUID` | **PK**, `DEFAULT gen_random_uuid()` | |
| `name` | `VARCHAR(50)` | `UNIQUE`, `NOT NULL` | Название тега. |

### 2.4 `locations_tags`

| Поле | Тип | Ключи/DEFAULT | Описание |
|------|-----|---------------|----------|
| `location_id` | `UUID` | **PK (часть)**, **FK → locations.id** | Ссылка на локацию. |
| `tag_id` | `UUID` | **PK (часть)**, **FK → tags.id** | Ссылка на тег. |

### 2.5 `favourites`

| Поле | Тип | Ключи/DEFAULT | Описание |
|------|-----|---------------|----------|
| `user_id` | `VARCHAR(50)` | **PK (часть)**, **FK → users.id** | Пользователь, который добавил в избранное. |
| `location_id` | `UUID` | **PK (часть)**, **FK → locations.id** | Избранная локация. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()` | Дата добавления в избранное. |

---
## 3. Индексы и оптимизация

| Таблица | Индекс | Роль |
|---------|--------|------|
| `locations` | `idx_locations_user` (`user_id`) | Быстрый выбор локаций владельца. |
| `locations` | `idx_locations_title_trgm` `USING GIN(title gin_trgm_ops)` | Поиск по названию. |
| `locations_tags` | `idx_locations_tags_tag` (`tag_id`) | Фильтрация по тегу. |
| `favourites` | `idx_favourites_user` (`user_id`) | Список избранных пользователя. |
| `favourites` | `idx_favourites_location` (`location_id`) | Подсчёт лайков у локации. |
| `tags` | `UNIQUE (name)` | Исключить дубликаты. |

---
## 4. Миграции (SQL)

```sql
-- 4.1 Расширения
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- 4.2 Функция обновления updated_at
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- 4.3 users
create table if not exists public.users (
  id          varchar(50) primary key,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create trigger set_timestamp_users
  before update on public.users
  for each row execute procedure public.trigger_set_timestamp();

-- 4.4 locations
create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     varchar(50) references public.users(id) on delete cascade,
  title       text not null,
  description text,
  image_url   text,
  address     text,
  cost        text,
  source_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create trigger set_timestamp_locations
  before update on public.locations
  for each row execute procedure public.trigger_set_timestamp();

-- 4.5 tags
create table if not exists public.tags (
  id   uuid primary key default gen_random_uuid(),
  name varchar(50) not null unique
);

-- 4.6 locations_tags
create table if not exists public.locations_tags (
  location_id uuid references public.locations(id) on delete cascade,
  tag_id      uuid references public.tags(id) on delete cascade,
  primary key (location_id, tag_id)
);

-- 4.7 favourites
create table if not exists public.favourites (
  user_id     varchar(50) references public.users(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, location_id)
);

-- 4.8 Индексы
create index if not exists idx_locations_user on public.locations(user_id);
create index if not exists idx_locations_title_trgm on public.locations using gin (title gin_trgm_ops);
create index if not exists idx_locations_tags_tag on public.locations_tags(tag_id);
create index if not exists idx_favourites_user on public.favourites(user_id);
create index if not exists idx_favourites_location on public.favourites(location_id);
```

---
## 5. RPC-функции 
```sql
-- add_location_tag
CREATE OR REPLACE FUNCTION public.add_location_tag(
  location_id uuid,
  tag_id uuid
) RETURNS void AS $$
INSERT INTO public.locations_tags(location_id, tag_id)
VALUES (location_id, tag_id)
ON CONFLICT DO NOTHING;
$$ LANGUAGE sql SECURITY DEFINER;

-- create_location_with_tags
create or replace function public.create_location_with_tags(
  p_user_id     text,
  p_title       text,
  p_description text,
  p_address     text,
  p_cost        text,
  p_source_url  text,
  p_image_url   text,
  p_tags        text[]
)
returns public.locations
language plpgsql
security definer
as $$
declare
  loc public.locations%rowtype;
begin
  -- 1) Вставляем саму локацию
  insert into public.locations(
    user_id, title, description, address, cost, source_url, image_url
  )
  values (
    p_user_id, p_title, p_description, p_address, p_cost, p_source_url, p_image_url
  )
  returning * into loc;

  -- 2) Разворачиваем массив тегов, создаём новые и сразу читаем все id
  with 
    input_tags as (
      select distinct trim(t)::varchar(50) as name
      from unnest(p_tags) as t
    ),
    ins as (
      insert into public.tags(name)
      select name from input_tags
      on conflict (name) do nothing
      returning id, name
    ),
    all_ids as (
      -- берем id и из только что вставленных (ins), и из уже существующих
      select id from ins
      union
      select t.id
      from public.tags t
      join input_tags it on t.name = it.name
    )
  -- 3) Вставляем связи в locations_tags
  insert into public.locations_tags(location_id, tag_id)
  select loc.id, id
  from all_ids
  on conflict (location_id, tag_id) do nothing;

  return loc;
end;
$$;

-- update_location_with_tags
create or replace function public.update_location_with_tags(
  p_loc_id      uuid,
  p_title       text,
  p_description text,
  p_address     text,
  p_cost        text,
  p_source_url  text,
  p_image_url   text,
  p_tags        text[]
)
returns public.locations
language plpgsql
security definer
as $$
declare
  loc public.locations%rowtype;
begin
  -- 1) Обновляем поля локации
  update public.locations set
    title       = p_title,
    description = p_description,
    address     = p_address,
    cost        = p_cost,
    source_url  = p_source_url,
    image_url   = p_image_url
  where id = p_loc_id
  returning * into loc;

  -- 2) Удаляем старые связи
  delete from public.locations_tags
    where location_id = p_loc_id;

  -- 3) Вставляем новые теги (и создаём их, если нужно), а затем связи
  with 
    -- уникализируем входные имена тегов
    input_tags as (
      select distinct trim(t)::varchar(50) as name
      from unnest(p_tags) as t
    ),
    -- вставляем новые теги, игнорируя конфликты по имени
    ins as (
      insert into public.tags(name)
      select name from input_tags
      on conflict (name) do nothing
      returning id, name
    ),
    -- объединяем вновь вставленные и уже существующие теги
    all_ids as (
      select id from ins
      union
      select t.id
      from public.tags t
      join input_tags it on t.name = it.name
    )
  insert into public.locations_tags(location_id, tag_id)
  select p_loc_id, id
  from all_ids
  on conflict do nothing;

  return loc;
end;
$$;

-- delete_location
-- RPC-функция для удаления локации и всех её связей в locations_tags
CREATE OR REPLACE FUNCTION public.delete_location(
  location_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.locations_tags
    WHERE location_id = $1;

  DELETE FROM public.locations
    WHERE id = $1;
END;
$$;
```

---
## 6. Supabase Storage

* **Bucket:** `images` (название задаётся в `NEXT_PUBLIC_SUPABASE_BUCKET`).
* **Путь файла:** `{user_id}/{timestamp-rand}.{ext}` — генерируется утилитой `uploadImage` перед вызовом `create_location_with_tags` .
* **Удаление:** хук `useDeleteLocation` и утилита `deleteImage` удаляют файл из Storage при удалении/замене изображения .

---
## 7. Примечания

* **Бесконечная прокрутка** (`useLocations`) использует индекс `created_at desc` и курсоры (`lt('created_at', cursor)`) .
* **Поиск** реализован функцией `ILIKE '%…%'` + `pg_trgm`, что адекватно для ≤ 1000 записей.
* **Избранное** хранится в отдельной таблице; на фронте признак `isFavourite` вычисляется REST‑джойном `favourites!left(user_id)` .
* **RLS** допускает анонимный `INSERT` в `locations`/`tags`, потому что логин совпадает с `auth.uid()` (NextAuth Credentials) — это уже «идентифицированный» пользователь.

---