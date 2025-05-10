'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import uploadImage from '@/lib/uploadImage';
import deleteImage from '@/lib/deleteImage';

/**
 * Мутация для обновления существующей локации с возможной заменой изображения.
 * Если изображение заменено, после успешного обновления записи
 * старый файл в Storage автоматически удаляется.
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }

      const { imageFile, imgUrl: oldImageUrl, tags, ...rest } = data;

      /* 1. Нормализуем список тегов */
      const tagList = Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags.trim()
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      /* 2. Загружаем новое изображение (если передан File) */
      let publicUrl = oldImageUrl;
      const isImageReplaced = Boolean(imageFile);
      if (isImageReplaced) {
        try {
          publicUrl = await uploadImage(imageFile, userId);
        } catch (err) {
          toast.error('Не удалось загрузить новое изображение');
          throw err;
        }
      }

      /* 3. RPC‑обновление локации и тегов */
      const { data: updated, error } = await supabase.rpc(
        'update_location_with_tags',
        {
          p_loc_id:      id,
          p_title:       rest.title,
          p_description: rest.description,
          p_address:     rest.address,
          p_cost:        rest.cost,
          p_source_url:  rest.sourceUrl,
          p_image_url:   publicUrl,
          p_tags:        tagList,
        }
      );
      if (error) throw error;

      /* 4. Удаляем старый файл после успешного апдейта */
      if (isImageReplaced && oldImageUrl && oldImageUrl !== publicUrl) {
        // Не блокируем основную цепочку — ошибка удаления не критична
        deleteImage(oldImageUrl);
      }

      return updated;
    },

    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries(['location', id]);
      queryClient.invalidateQueries(['locations']);
      toast.success('Локация успешно обновлена');
    },

    onError: (err) => {
      toast.error(err.message || 'Ошибка при обновлении локации');
    },
  });
}
