'use client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

/**
 * useOneLocation — грузит деталь локации + теги (+ признак избранного).
 * @param id UUID локации
 */
export function useOneLocation(id) {
  return useQuery({
    queryKey: ['location', id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async () => {
      /* 1. REST‑join locations ← locations_tags ← tags */
      const { data, error } = await supabase
        .from('locations')
        .select(
          '*, locations_tags(tag_id, tags(name)), favourites!left(user_id)'
        )                      // favourites нужен, чтобы вычислить isFavourite
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        imgUrl: data.image_url,            // camelCase на фронте :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
        tags: data.locations_tags.map((lt) => lt.tags.name),
        isFavourite: data.favourites?.length > 0,
      };
    },
    onError: (err) =>
      toast.error(
        err?.message || 'Не удалось загрузить информацию о локации'
      ),
  });
}
