import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import { qk } from '@/lib/query-keys';
import toast from 'react-hot-toast';
import uploadImage from '@/lib/uploadImage';
import deleteImage from '@/lib/deleteImage';
/** Список направлений текущего пользователя */
export function useDirections() {
  const { data: session, status } = useSession();

  return useQuery({
    queryKey: qk.directions(),
    // Запускаем только когда точно знаем, что пользователь авторизован
    enabled: status === 'authenticated',
    staleTime: 60_000,
    queryFn: async () => {
      // Без фильтра по user_id — получаем все направления
      const { data, error } = await supabase
        .from('directions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
/** Создать новое направление (RPC add_direction) */
export function useAddDirection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    /** @param {{ title:string, country:string, city?:string|null, coverFile:File }} payload */
    mutationFn: async ({ title, country, city = null, coverFile }) => {
      if (!userId) throw new Error('Пользователь не авторизован');
      if (!coverFile) throw new Error('Обложка обязательна');

      // 1) Загрузка изображения в Storage
      const cover_url = await uploadImage(coverFile, userId);

      // 2) RPC‑вставка
      const { data, error } = await supabase.rpc('add_direction', {
        p_user_id: userId,
        p_title: title,
        p_country: country,
        p_city: city,
        p_cover_url: cover_url,
      });
      if (error) {
        // Откат загруженного файла при ошибке
        await deleteImage(cover_url).catch(() => {});
        throw error;
      }
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries(qk.directions());
      toast.success('Направление создано');
    },

    onError: (err) => {
      toast.error(err.message || 'Не удалось создать направление');
    },
  });
}
/** Обновить существующее направление (RPC update_direction) */
export function useUpdateDirection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * @param {{ id:string, data:{ title?:string, country?:string, city?:string|null, coverFile?:File|null, oldCoverUrl?:string|null } }} vars
     */
    mutationFn: async ({ id, data }) => {
      if (!userId) throw new Error('Пользователь не авторизован');

      const { title, country, city, coverFile, oldCoverUrl } = data;
      let cover_url = oldCoverUrl ?? null;
      const isCoverChanged = Boolean(coverFile);

      if (isCoverChanged) {
        cover_url = await uploadImage(coverFile, userId);
      }

      const { data: updated, error } = await supabase.rpc('update_direction', {
        p_user_id: userId,
        p_direction_id: id,
        p_title: title,
        p_country: country,
        p_city: city,
        p_cover_url: cover_url,
      });

      if (error) {
        if (isCoverChanged) await deleteImage(cover_url).catch(() => {});
        throw error;
      }

      // Удаляем старый cover после успешного обновления
      if (isCoverChanged && oldCoverUrl && oldCoverUrl !== cover_url) {
        deleteImage(oldCoverUrl).catch(() => {});
      }

      return updated;
    },

    onSuccess: () => {
      queryClient.invalidateQueries(qk.directions());
      toast.success('Направление обновлено');
    },

    onError: (err) => toast.error(err.message || 'Ошибка при обновлении направления'),
  });
}
/** Удалить направление + каскад локаций (RPC delete_direction) */
export function useDeleteDirection() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    /** @param {{ id:string, coverUrl?:string|null }} vars */
    mutationFn: async ({ id, coverUrl }) => {
      if (!userId) throw new Error('Пользователь не авторизован');

      const { error } = await supabase.rpc('delete_direction', {
        p_user_id: userId,
        p_direction_id: id,
      });
      if (error) throw error;
      // cover‑файл больше не нужен
      if (coverUrl) deleteImage(coverUrl).catch(() => {});

      return { id };
    },
    // ----- optimistic removal из списка -----
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries(qk.directions());
      const prev = queryClient.getQueryData(qk.directions());
      queryClient.setQueryData(qk.directions(), (old = []) =>
        old.filter((d) => d.id !== id),
      );
      return { prev };
    },

    onError: (err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.directions(), ctx.prev);
      toast.error(err.message || 'Не удалось удалить направление');
    },

    onSuccess: () => {
      // directions + все кэши локаций, связанные с веткой
      queryClient.invalidateQueries(qk.directions());
      queryClient.removeQueries({ queryKey: ['locations'], exact: false });
      toast.success('Направление удалено');
    },
  });
}