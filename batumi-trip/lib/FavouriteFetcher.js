'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useUIStore } from '@/store/uiStore';

/**
 * FavouriteFetcher — при смене пользователя подтягивает или очищает избранное.
 */
export default function FavouriteFetcher() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const hydrateFavourites = useUIStore((s) => s.hydrateFavourites);

  useEffect(() => {
    if (userId) {
      // При логине — подгружаем current favourites
      (async () => {
        try {
          const data = await queryClient.fetchQuery({
            queryKey: ['favourites', userId],
            queryFn: async () => {
              const { data, error } = await supabase
                .from('favourites')
                .select('location_id')
                .eq('user_id', userId);
              if (error) throw error;
              return data;
            },
          });

          // гидратируем Zustand-мэп: { [locationId]: true }
          hydrateFavourites(data.map((f) => f.location_id));
        } catch (e) {
          console.error('FavouriteFetcher:', e);
        }
      })();
    } else {
      // При логауте — сбрасываем локальное состояние и чистим кеш
      hydrateFavourites([]);
      queryClient.removeQueries({ queryKey: ['favourites'] });
    }
  }, [userId, queryClient, hydrateFavourites]);

  return null;
}
