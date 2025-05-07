'use client';
import { useEffect, useRef } from 'react';
import { useLocations } from '@/hooks/useLocations';
import LocationCard from '@/components/LocationCard';
import SkeletonCard from '@/components/SkeletonCard';

/**
 * Контейнер списка локаций с бесконечной прокруткой.
 * Описан в ComponentsDesign‑BatumiTrip.md (LocationList).
 */
export default function LocationList() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLocations();

  const sentinelRef = useRef(null);

  // IntersectionObserver для подзагрузки следующей страницы
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  if (isError) {
    return (
      <p className="text-destructive text-center">Не удалось загрузить локации…</p>
    );
  }

  const locations = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Первичная загрузка */}
      {isLoading &&
        Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`s${i}`} />)}

      {/* Сами локации */}
      {locations.map((loc) => (
        <LocationCard key={loc.id} {...loc} />
      ))}

      {/* Sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Лоадер при подгрузке */}
      {isFetchingNextPage &&
        Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`n${i}`} />)}
    </div>
  );
}