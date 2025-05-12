'use client';
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';

/**
 * useToggleFavourite(id) — возвращает функцию‑обработчик, которую нужно вызывать
 * при клике на «звёздочку». Хук:
 *  • Оптимистично переключает локальный флаг избранного в Zustand;
 *  • POST /DELETE в таблицу favourites;
 *  • Инвалидирует кеши favourites, location, locations;
 *  • Если пользователь не авторизован — открывает LoginModal.
 *
 * @param {string} locationId UUID локации
 * @returns {() => void} функция‑обработчик
 */
export function useToggleFavourite(locationId) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const queryClient = useQueryClient();
  const setLoginModal = useUIStore((s) => s.setLoginModal);
  const favouritesMap  = useUIStore((s) => s.favourites);
  const toggleFavouriteLocal = useUIStore((s) => s.toggleFavourite);

  /** Реальный запрос к Supabase */
  const mutation = useMutation({
    mutationFn: async (isCurrentlyFav) => {
      if (!userId) throw new Error('auth-required');

      if (isCurrentlyFav) {
        // удалить
        const { error } = await supabase
          .from('favourites')
          .delete()
          .eq('user_id', userId)
          .eq('location_id', locationId);
        if (error) throw error;
      } else {
        // добавить
        const { error } = await supabase
          .from('favourites')
          .insert({ user_id: userId, location_id: locationId });
        if (error) throw error;
      }
    },

    // ---------- optimistic update ----------
    onMutate: async () => {
      const prevIsFav = Boolean(favouritesMap[locationId]);
      toggleFavouriteLocal(locationId);                 // локальный optimistic
      await queryClient.cancelQueries(['favourites', userId]);
      return { prevIsFav };
    },

    onError: (err, _vars, ctx) => {
      if (err?.message === 'auth-required') {
        setLoginModal(true);                            // открыть модалку логина
        return;
      }
      // откат optimistic‑переключения
      toggleFavouriteLocal(locationId);
      if (ctx?.prevIsFav !== undefined) {
        queryClient.setQueryData(['favourites', userId], (old) => old);
      }
      toast.error(err.message || 'Не удалось обновить избранное');
    },

    onSuccess: () => {
      queryClient.invalidateQueries(['favourites', userId]);
      queryClient.invalidateQueries(['location', locationId]);
      queryClient.invalidateQueries(['locations']);
    },
  });

  /** Хэндлер, который будет привязан к onClick */
  return useCallback(() => {
    if (!userId) {
      // не авторизован — просто показываем LoginModal
      setLoginModal(true);
      return;
    }
    mutation.mutate(Boolean(favouritesMap[locationId]));
  }, [mutation, userId, favouritesMap, locationId, setLoginModal]);
}
