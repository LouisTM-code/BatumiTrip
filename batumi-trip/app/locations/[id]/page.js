// app/locations/[id]/page.jsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';                                      // useAuth.js восстанавливает сессию из cookie и возвращает { user, isLoading } :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
import { useOneLocation } from '@/hooks/useOneLocation';
import LocationDetail from '@/components/LocationDetail';
import LocationForm from '@/components/LocationForm';                             // Форму для редактирования/добавления локации :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
import SkeletonCard from '@/components/SkeletonCard';
import { Button } from '@/components/ui/button';

export default function LocationDetailPage() {
  const { id } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { data: location, isLoading, isError } = useOneLocation(id);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

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

  // только автор (location.user_id) может редактировать
  const canEdit = user?.id === location.user_id;

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* 3. Рендерим либо просмотр, либо форму */}
      {!isEditing ? (
        <>
          <LocationDetail location={location} />

          {/* 1+2. Кнопка «Редактировать» здесь, и только если canEdit */}
          {canEdit && (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Редактировать
            </Button>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Редактировать локацию</h1>
          <LocationForm 
            initialData={location} 
            onSuccess={ () => {
              setIsEditing(false);
            }}
          />
          <Button variant="link" onClick={() => setIsEditing(false)}>
            Отмена
          </Button>
        </>
      )}
    </main>
  );
}
