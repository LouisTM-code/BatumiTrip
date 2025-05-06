-- 4.1 Расширения
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- 4.2 Функция обновления updated_at
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- 4.3 users
create table if not exists public.users (
  id          varchar(50) primary key,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create trigger set_timestamp_users
  before update on public.users
  for each row execute procedure public.trigger_set_timestamp();

-- 4.4 locations
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

-- 4.5 tags
create table if not exists public.tags (
  id   uuid primary key default gen_random_uuid(),
  name varchar(50) not null unique
);

-- 4.6 locations_tags
create table if not exists public.locations_tags (
  location_id uuid references public.locations(id) on delete cascade,
  tag_id      uuid references public.tags(id) on delete cascade,
  primary key (location_id, tag_id)
);

-- 4.7 favourites
create table if not exists public.favourites (
  user_id     varchar(50) references public.users(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, location_id)
);

-- 4.8 Индексы
create index if not exists idx_locations_user on public.locations(user_id);
create index if not exists idx_locations_title_trgm on public.locations using gin (title gin_trgm_ops);
create index if not exists idx_locations_tags_tag on public.locations_tags(tag_id);
create index if not exists idx_favourites_user on public.favourites(user_id);
create index if not exists idx_favourites_location on public.favourites(location_id);