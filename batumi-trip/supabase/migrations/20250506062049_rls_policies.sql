-- 5. Политики RLS (исправлено приведение типов)

-- USERS
alter table public.users enable row level security;

create policy "Users: everyone select"
  on public.users for select using (true);

create policy "Users: anon insert"
  on public.users
  for insert
  with check (true);

create policy "Users: anon update"
  on public.users for update
  using (true)
  with check (true);

create policy "Users: self delete"
  on public.users for delete using (auth.uid()::text = id);

-- LOCATIONS
alter table public.locations enable row level security;

create policy "Locations: everyone select"
  on public.locations for select using (true);

create policy "Locations: owner insert"
  on public.locations for insert with check (auth.uid()::text = user_id);

create policy "Locations: owner update"
  on public.locations for update
    using (auth.uid()::text = user_id)
    with check (auth.uid()::text = user_id);

create policy "Locations: owner delete"
  on public.locations for delete using (auth.uid()::text = user_id);

-- TAGS
alter table public.tags       enable row level security;

create policy "Tags: everyone select"
  on public.tags for select using (true);

create policy "Tags: any insert"
  on public.tags for insert with check (true);

-- LOCATIONS_TAGS
alter table public.locations_tags enable row level security;

create policy "LT: everyone select"
  on public.locations_tags for select using (true);

create policy "LT: owner insert"
  on public.locations_tags for insert with check (
    (select user_id from public.locations where id = location_id)::text = auth.uid()::text
  );

create policy "LT: owner delete"
  on public.locations_tags for delete using (
    (select user_id from public.locations where id = location_id)::text = auth.uid()::text
  );

-- FAVOURITES
alter table public.favourites enable row level security;

create policy "Fav: owner select"
  on public.favourites for select using (auth.uid()::text = user_id);

create policy "Fav: owner insert"
  on public.favourites for insert with check (auth.uid()::text = user_id);

create policy "Fav: owner delete"
  on public.favourites for delete using (auth.uid()::text = user_id);
