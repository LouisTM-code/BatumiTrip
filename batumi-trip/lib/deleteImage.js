import { supabase } from '@/lib/supabaseClient';
/**
 * Удаляет файл из Supabase Storage по его публичному URL.
 * Ошибка удаления не прерывает основной поток, но выводится в console.
 *
 * @param {string|null|undefined} imageUrl – публичный URL старого изображения
 * @returns {Promise<void>}
 */
export default async function deleteImage(imageUrl) {
  if (!imageUrl) return;

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;
  if (!bucket) {
    console.error('ENV NEXT_PUBLIC_SUPABASE_BUCKET not defined – skip delete.');
    return;
  }

  // Ищем часть пути после …/object/public/{bucket}/
  const marker = `/${bucket}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) {
    console.warn('deleteImage: cannot parse path from url', imageUrl);
    return;
  }
  const filePath = imageUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) {
    console.error('deleteImage: failed to remove old image', error);
  }
}
