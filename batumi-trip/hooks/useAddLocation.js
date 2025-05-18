'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import uploadImage from '@/lib/uploadImage';
import { useUIStore } from '@/store/uiStore';

/**
 * Мутация для создания новой локации с загрузкой изображения в Storage
 * и передачей direction_id в RPC.
 */
export function useAddLocation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const activeDirectionId = useUIStore((s) => s.activeDirectionId);

  return useMutation({
    mutationFn: async (formData) => {
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }
      if (!activeDirectionId) {
        throw new Error('Не выбран маршрут (direction_id)');
      }

      const { imageFile, tags, ...rest } = formData;

      // 1. Нормализация тегов
      const tagList = Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags.trim()
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      // 2. Загрузка изображения
      let image_url = null;
      if (imageFile) {
        try {
          image_url = await uploadImage(imageFile, userId);
        } catch (err) {
          toast.error('Не удалось загрузить изображение');
          throw err;
        }
      }

      // 3. Вызов обновлённого RPC с direction_id
      const { data, error } = await supabase.rpc(
        'create_location_with_tags',
        {
          p_user_id:     userId,
          p_title:       rest.title,
          p_description: rest.description,
          p_address:     rest.address,
          p_cost:        rest.cost,
          p_source_url:  rest.sourceUrl,
          p_image_url:   image_url,
          p_tags:        tagList,
          p_direction_id: activeDirectionId,
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['locations']);
      queryClient.invalidateQueries(['tags']);
      toast.success('Локация успешно добавлена');
    },
    onError: (err) => {
      toast.error(err.message || 'Ошибка при добавлении локации');
    },
  });
}
