// app/page.jsx
'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import TagsPrefetcher from '@/lib/TagsPrefetcher';
import SkeletonCard from '@/components/SkeletonCard';
import DestinationCard from '@/components/DestinationCard';
import AddDestinationButton from '@/components/AddDestinationButton';
import { useDirections } from '@/hooks/directionsHooks';
import { useUIStore } from '@/store/uiStore';

/**
 * DestinationHubPage — главная страница-хаб, показывающая все направления
 * текущего пользователя. При монтировании сбрасывает activeDirectionId → null.
 */
export default function DestinationHubPage() {
  // Получаем список направлений
  const {
    data: directions = [],
    isLoading,
    isError,
  } = useDirections();

  // Сбрасываем активную ветку в Zustand при входе на хаб
  const setActiveDirection = useUIStore((s) => s.setActiveDirection);
  useEffect(() => {
    setActiveDirection(null);
  }, [setActiveDirection]);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* Префетчим теги для SearchBar */}
      <TagsPrefetcher />

      <Header />

      {/* Сетка направлений: Mobile First — 1 колонка, sm+: 2 */}
      <div id="destinationGrid" className="grid grid-cols-1 gap-4">
        {/* Во время загрузки показываем 4 скелетона */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}

        {/* Ошибка загрузки */}
        {isError && (
          <p className="col-span-full text-center text-destructive">
            Не удалось загрузить направления.
          </p>
        )}

        {/* Данные получены */}
        {!isLoading &&
          !isError &&
          directions.map((dir) => (
            <DestinationCard key={dir.id} direction={dir} />
          ))}

        {/* Пустой список */}
        {!isLoading && !isError && directions.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            У вас пока нет направлений. Нажмите «Добавить» и создайте первое!
          </p>
        )}
      </div>

      {/* Плавающая кнопка «Добавить направление» */}
      <AddDestinationButton />
    </main>
  );
}
