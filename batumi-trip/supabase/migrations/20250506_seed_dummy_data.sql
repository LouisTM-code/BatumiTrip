BEGIN;

-- 1. Users
INSERT INTO public.users (id) VALUES
  ('alice'),
  ('bob'),
  ('charlie');

-- 2. Tags
INSERT INTO public.tags (id, name) VALUES
  ('d1d1d1d1-0000-0000-0000-000000000001', 'beach'),
  ('d1d1d1d1-0000-0000-0000-000000000002', 'historical'),
  ('d1d1d1d1-0000-0000-0000-000000000003', 'nature'),
  ('d1d1d1d1-0000-0000-0000-000000000004', 'museum'),
  ('d1d1d1d1-0000-0000-0000-000000000005', 'cafe');

-- 3. Locations
INSERT INTO public.locations (
  id, user_id, title, description, image_url, address, cost, source_url
) VALUES
  (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'alice',
    'Batumi Beach',
    'Sunny beach with golden sand.',
    '',
    'Batumi Beach',
    'free',
    ''
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000002',
    'bob',
    'Old Town',
    'Historic part of the city with medieval architecture.',
    '',
    'Old Town, Batumi',
    '20 GEL',
    ''
  ),
  (
    'a1b2c3d4-0000-0000-0000-000000000003',
    'charlie',
    'Europe Square',
    'Central square with fountains and cafes.',
    '',
    'Europe Square, Batumi',
    '0 GEL',
    ''
  );

-- 4. Locations_Tags
INSERT INTO public.locations_tags (location_id, tag_id) VALUES
  -- Batumi Beach: beach, nature
  ('a1b2c3d4-0000-0000-0000-000000000001', 'd1d1d1d1-0000-0000-0000-000000000001'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'd1d1d1d1-0000-0000-0000-000000000003'),
  -- Old Town: historical, museum
  ('a1b2c3d4-0000-0000-0000-000000000002', 'd1d1d1d1-0000-0000-0000-000000000002'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'd1d1d1d1-0000-0000-0000-000000000004'),
  -- Europe Square: cafe, historical
  ('a1b2c3d4-0000-0000-0000-000000000003', 'd1d1d1d1-0000-0000-0000-000000000005'),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'd1d1d1d1-0000-0000-0000-000000000002');

-- 5. Favourites
INSERT INTO public.favourites (user_id, location_id) VALUES
  ('alice',   'a1b2c3d4-0000-0000-0000-000000000002'),
  ('bob',     'a1b2c3d4-0000-0000-0000-000000000001'),
  ('charlie', 'a1b2c3d4-0000-0000-0000-000000000003');

COMMIT;
