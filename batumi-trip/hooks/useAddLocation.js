'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Хук для создания новой локации + тегов через RPC create_location_with_tags.
 */
export function useAddLocation() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;

  return useMutation({
    mutationFn: async (formData) => {
      if (!session?.user?.id) {
        throw new Error('Пользователь не авторизован');
      }
      const user_id = session.user.id;
      const { imageFile, tags, ...rest } = formData;
      console.log("▶ imageFile:", formData.imageFile);

      // 1. Нормализация тегов в массив строк
      let tagList = [];
      if (Array.isArray(tags)) {
        tagList = tags;
      } else if (typeof tags === 'string' && tags.trim()) {
        tagList = tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }

      // 2. Загрузка картинки, если передан FileList
      let image_url = null;
      if (imageFile?.length) {
        const file = imageFile[0];                // первый файл из FileList
        const ext = file.name.split('.').pop();
        const filePath = `${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }
      console.log("▶ imageFile:", formData.imageFile);
      // 3. Atomic RPC: создаёт локацию + теги + связи
      const { data, error } = await supabase.rpc(
        'create_location_with_tags',
        {
          p_user_id:     user_id,
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
    },
  });
}
