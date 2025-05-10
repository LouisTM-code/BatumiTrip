'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ChooseTag from '@/components/ChooseTag';
import AttachImage from './AttachImage';
import { useAddLocation } from '@/hooks/useAddLocation';
import { useUpdateLocation } from '@/hooks/useUpdateLocation';
import { useRouter } from 'next/navigation';

/**
 * Форма создания или редактирования локации.
 * Если передан initialData.id — режим редактирования, иначе — создания.
 */
export default function LocationForm({ initialData = {}, onSuccess }) {
  const router = useRouter();
  const addLocation = useAddLocation();
  const updateLocation = useUpdateLocation();
  const isEditMode = Boolean(initialData.id);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title:       initialData.title       || '',
      description: initialData.description || '',
      address:     initialData.address     || '',
      cost:        initialData.cost        || '',
      sourceUrl:   initialData.sourceUrl   || '',
      tags:        initialData.tags        || [],
      imageFile:   null,
    },
  });

  const onSubmit = (data) => {
    // Собираем payload с file и старым imgUrl
    const payload = {
      title:       data.title,
      description: data.description,
      address:     data.address,
      cost:        data.cost,
      sourceUrl:   data.sourceUrl,
      imageFile:   data.imageFile,
      imgUrl:      initialData.imgUrl   || null,
      tags:        data.tags,
    };

    if (isEditMode) {
      updateLocation.mutate(
        { id: initialData.id, data: payload },
        { onSuccess: () => onSuccess?.() }
      );
    } else {
      addLocation.mutate(
        payload,
        { onSuccess: (loc) => router.push(`/locations/${loc.id}`) }
      );
    }
  };

  const isSubmitting = isEditMode
    ? updateLocation.isLoading
    : addLocation.isLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Заголовок */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Заголовок
        </label>
        <Input
          id="title"
          {...register('title', { required: 'Обязательное поле' })}
          className="mt-1 w-full"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Описание */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Описание
        </label>
        <Textarea
          id="description"
          {...register('description')}
          className="mt-1 w-full"
          rows={4}
        />
      </div>

      {/* Адрес */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium">
          Адрес
        </label>
        <Input
          id="address"
          {...register('address')}
          className="mt-1 w-full"
        />
      </div>

      {/* Стоимость */}
      <div>
        <label htmlFor="cost" className="block text-sm font-medium">
          Стоимость
        </label>
        <Input
          id="cost"
          type="number"
          {...register('cost')}
          className="mt-1 w-full"
        />
      </div>

      {/* Ссылка на источник */}
      <div>
        <label htmlFor="sourceUrl" className="block text-sm font-medium">
          Ссылка на источник
        </label>
        <Input
          id="sourceUrl"
          {...register('sourceUrl')}
          className="mt-1 w-full"
        />
      </div>

      {/* Выбор тегов */}
      <div>
        <label className="block text-sm font-medium">Теги</label>
        <ChooseTag control={control} name="tags" />
      </div>

      {/* Картинка */}
      <div>
        <label className="block text-sm font-medium">Изображение</label>
        <AttachImage control={control} name="imageFile" className="mt-1" />
      </div>

      {/* Кнопка */}
      <Button type="submit" disabled={isSubmitting}>
        {isEditMode
          ? isSubmitting
            ? 'Сохраняем…'
            : 'Сохранить изменения'
          : isSubmitting
          ? 'Сохраняем…'
          : 'Сохранить'}
      </Button>
    </form>
  );
}
