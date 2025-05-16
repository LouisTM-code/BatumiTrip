-- 20250515_directions.sql
-- Migration: add "directions" entity and related infrastructure for BatumiTrip
-- ---------------------------------------------------------------------------

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Table: directions
CREATE TABLE IF NOT EXISTS public.directions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    VARCHAR(50) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  country    TEXT NOT NULL,
  city       TEXT,
  cover_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: locations (augment with direction)
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS direction_id UUID REFERENCES public.directions(id) ON DELETE CASCADE;

-- 4. Indexes
-- Accelerates infinite scroll inside a branch
CREATE INDEX IF NOT EXISTS locations_direction_created_at_idx
  ON public.locations (direction_id, created_at DESC);

-- 5. Row-Level Security
ALTER TABLE public.directions     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites     DISABLE ROW LEVEL SECURITY;

-- 6. RPC helpers
-- NOTE: All functions are SECURITY DEFINER so that they can bypass RLS if it is enabled in the future.

-- 6.1 add_direction: create a new direction for the given user
CREATE OR REPLACE FUNCTION public.add_direction(
  p_user_id    TEXT,
  p_title      TEXT,
  p_country    TEXT,
  p_city       TEXT DEFAULT NULL,
  p_cover_url  TEXT DEFAULT NULL
)
RETURNS public.directions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec public.directions;
BEGIN
  INSERT INTO public.directions (user_id, title, country, city, cover_url, created_at, updated_at)
  VALUES (p_user_id, p_title, p_country, p_city, p_cover_url, now(), now())
  RETURNING * INTO rec;
  RETURN rec;
END;
$$;

-- 6.2 update_direction: patch an existing direction
CREATE OR REPLACE FUNCTION public.update_direction(
  p_user_id      TEXT,
  p_direction_id UUID,
  p_title        TEXT DEFAULT NULL,
  p_country      TEXT DEFAULT NULL,
  p_city         TEXT DEFAULT NULL,
  p_cover_url    TEXT DEFAULT NULL
)
RETURNS public.directions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec public.directions;
BEGIN
  UPDATE public.directions
  SET
    title      = COALESCE(p_title, title),
    country    = COALESCE(p_country, country),
    city       = COALESCE(p_city, city),
    cover_url  = COALESCE(p_cover_url, cover_url),
    updated_at = now()
  WHERE id = p_direction_id
    AND user_id = p_user_id
  RETURNING * INTO rec;
  RETURN rec;
END;
$$;

-- 6.3 delete_direction: cascade-delete a direction and its locations
CREATE OR REPLACE FUNCTION public.delete_direction(
  p_user_id      TEXT,
  p_direction_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.locations
  WHERE direction_id = p_direction_id
    AND user_id = p_user_id;

  DELETE FROM public.directions
  WHERE id = p_direction_id
    AND user_id = p_user_id;
END;
$$;