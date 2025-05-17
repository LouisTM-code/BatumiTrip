'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import TagsPrefetcher from '@/lib/TagsPrefetcher';
import LocationList from '@/components/LocationList';
import AddLocationButton from '@/components/AddLocationButton';
import FavouriteFilterButton from '@/components/FavouriteFilterButton';
import { useUIStore } from '@/store/uiStore';

/**
 * Обёртка над прежним LocationListPage.
 * • Читает dirId из params.
 * • Выставляет uiStore.activeDirectionId.
 * • UI остаётся неизменным.
 */
export default function LocationListPageWrapper() {
  const { dirId } = useParams();
  const setActiveDirection = useUIStore((s) => s.setActiveDirection);

  /* выставляем активную ветку и сбрасываем при размонтировании */
  useEffect(() => {
    setActiveDirection(dirId || null);
    return () => setActiveDirection(null);
  }, [dirId, setActiveDirection]);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <TagsPrefetcher />
      <Header />
      <LocationList />
      <AddLocationButton />
      <FavouriteFilterButton />
    </main>
  );
}
