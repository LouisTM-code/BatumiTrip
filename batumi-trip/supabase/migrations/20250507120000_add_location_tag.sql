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
