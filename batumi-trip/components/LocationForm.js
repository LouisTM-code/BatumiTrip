// components/LocationForm.js
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ChooseTag from '@/components/ChooseTag';
import { useAddLocation } from '@/hooks/useAddLocation';
import { useRouter } from 'next/navigation';

/**
 * Форма добавления/редактирования локации.
 * Теперь использует ChooseTag для работы с массивом тегов.
 */
export default function LocationForm({ initialData } = {}) {
  const router = useRouter();
  const addLocation = useAddLocation();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...initialData,
      tags: initialData?.tags || [],     // обязательно задаём tags: [] по-умолчанию
    },
  });

  const onSubmit = (data) => {
    addLocation.mutate(data, {
      onSuccess: (location) => {
        console.log('send');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Заголовок, описание, адрес и т.д. */}
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

      {/* Блок выбора/добавления тегов */}
      <div>
        <label className="block text-sm font-medium">Теги</label>
        <ChooseTag control={control} name="tags" />
      </div>

      {/* Загрузка изображения */}
      <div>
        <label htmlFor="imageFile" className="block text-sm font-medium">
          Изображение
        </label>
        <Input
          id="imageFile"
          type="file"
          accept="image/*"
          {...register('imageFile')}
          className="mt-1 w-full"
        />
      </div>

      <Button type="submit" disabled={addLocation.isLoading}>
        {addLocation.isLoading ? 'Сохраняем…' : 'Сохранить'}
      </Button>
    </form>
  );
}
