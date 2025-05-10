// lib/uploadImage.js
import { supabase } from '@/lib/supabaseClient';

/**
 * Загружает файл в Supabase Storage и возвращает публичный URL.
 * @param {File} file - файл для загрузки
 * @param {string} userId - ID текущего пользователя, будет использован в пути хранения
 * @returns {Promise<string>} публичный URL загруженного файла
 */
export default async function uploadImage(file, userId) {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;
  if (!bucket) {
    throw new Error('Bucket name is not defined in environment variables');
  }

  // Генерируем «чистый» идентификатор папки: только латиница, цифры, "-" и "_"
  const safeUserId = (userId || 'anon')
    .toString()
    .replace(/[^A-Za-z0-9_-]/g, '_');

  // Расширение и уникальное имя файла
  const ext = file.name.split('.').pop();
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = `${timestamp}-${randomStr}.${ext}`;

  // Конечный путь в хранилище
  const filePath = `${safeUserId}/${fileName}`;

  // Загрузка файла
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: false });
  if (uploadError) {
    throw uploadError;
  }

  // Получение публичного URL
  const { data: urlData, error: urlError } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  if (urlError) {
    throw urlError;
  }

  return urlData.publicUrl;
}
