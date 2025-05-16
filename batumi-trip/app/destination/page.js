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
 * DestinationHubPage ― главная страница-хаб направлений.
 * • Загружает список направлений (direction) из БД через useDirections().
 * • Пока данные в пути — показывает 4 SkeletonCard.
 * • После успешной загрузки выводит DestinationCard на каждое направление
 *   либо дружелюбный call-to-action, если направлений нет.
 * • Сброс activeDirection при монтировании.
 * • Grid mobile-first: 1 колонка → sm:2.
 */
export default function DestinationHubPage() {
  /* ---------- запрос направлений ---------- */
  const {
    data: directions = [],
    isLoading,
    isError,
  } = useDirections();

  /* ---------- сбрасываем активную ветку при входе в хаб ---------- */
  const setActiveDirection = useUIStore((s) => s.setActiveDirection);
  useEffect(() => {
    setActiveDirection(null);
  }, [setActiveDirection]);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* Prefetch словаря тегов (чтобы SearchBar был «тёплым») */}
      <TagsPrefetcher />

      {/* Глобальный Header */}
      <Header />

      {/* ---------------- Grid направлений (Mobile-First: 1 → sm:2) ---------------- */}
      <div
        id="destinationGrid"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* 1. Загрузка — 4 скелетона */}
        {isLoading &&
          [...Array(4)].map((_, idx) => <SkeletonCard key={idx} />)}

        {/* 2. Ошибка */}
        {isError && (
          <p className="col-span-full text-center text-destructive">
            Не удалось загрузить направления.
          </p>
        )}

        {/* 3. Данные получены и есть что показывать */}
        {!isLoading && !isError && directions.length > 0 &&
          directions.map((dir) => (
            <DestinationCard key={dir.id} direction={dir} />
          ))}

        {/* 4. Данные получены, но пусто */}
        {!isLoading && !isError && directions.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            У вас пока нет направлений. Нажмите «Добавить» и создайте первое!
          </p>
        )}
      </div>
      {/* Плавающая FAB поверх грида */}
      <AddDestinationButton />
    </main>
  );
}
