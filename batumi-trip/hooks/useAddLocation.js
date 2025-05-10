'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import uploadImage from '@/lib/uploadImage';

/**
 * Мутация для создания новой локации с загрузкой изображения в Storage.
 */
export function useAddLocation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: async (formData) => {
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }
      const { imageFile, tags, ...rest } = formData;

      // 1. Нормализация тегов
      let tagList = [];
      if (Array.isArray(tags)) {
        tagList = tags;
      } else if (typeof tags === 'string' && tags.trim()) {
        tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      }

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

      // 3. Вызов RPC для создания локации вместе с тегами
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