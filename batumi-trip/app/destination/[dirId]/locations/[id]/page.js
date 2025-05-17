// app/locations/[id]/page.jsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOneLocation } from '@/hooks/useOneLocation';
import { useDeleteLocation } from '@/hooks/useDeleteLocation';
import LocationDetail from '@/components/LocationDetail';
import LocationForm from '@/components/LocationForm';
import SkeletonCard from '@/components/SkeletonCard';
import { Button } from '@/components/ui/button';

export default function LocationDetailPage() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { data: location, isLoading, isError } = useOneLocation(id);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // хук удаления
  const deleteMutation = useDeleteLocation();

  // пока идёт загрузка данных или авторизации — показываем скелетон
  if (isLoading || authLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <SkeletonCard />
      </main>
    );
  }

  if (isError || !location) {
    return (
      <main className="container mx-auto px-4 py-6 text-destructive">
        Не удалось загрузить локацию.
      </main>
    );
  }

  // только автор (location.user_id) может редактировать / удалять
  const canEdit = user?.id === location.user_id;

  // удаление с подтверждением
  const handleDelete = () => {
    if (!window.confirm('Удалить локацию безвозвратно?')) return;
    deleteMutation.mutate(
      { id, imageUrl: location.imgUrl },
      {
        onSuccess: () => {
          router.push(`/destination/${location.direction_id}`);
        },
      },
    );
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* 3. Рендерим либо просмотр, либо форму */}
      {!isEditing ? (
        <>
          <LocationDetail location={location} />

          {/* 1+2. Кнопки «Редактировать» и «Удалить» доступны только автору */}
          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? 'Удаляем…' : 'Удалить'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <LocationForm
            initialData={location}
            onSuccess={() => {
              setIsEditing(false);
            }}
          />
        </>
      )}
    </main>
  );
}
