"use client";

import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useLocations } from "@/hooks/useLocations";
import SkeletonCard from "@/components/SkeletonCard";
import LocationCard from "@/components/LocationCard";

/**
 * LocationList — контейнер для списка карточек локаций.
 * При монтировании вызывает useLocations() (useInfiniteQuery).
 * Пока isLoading — рендерит несколько SkeletonCard.
 * Затем выводит LocationCard для каждой локации.
 * При скролле до конца (Intersection Observer) — вызывает fetchNextPage().
 */
const LocationList = () => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLocations();
  const { ref, inView } = useInView();

  // При появлении таргета вьюпорт вызывает загрузку следующей страницы
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (isLoading) {
    // Рендерим 6 скелетонов пока идёт загрузка :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Ошибка загрузки локаций</div>;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.pages.map(page =>
          page.items.map(location => (
            <LocationCard key={location.id} location={location} />
          ))
        )}
      </div>
      {/* Целевая точка для Intersection Observer */}
      <div ref={ref} className="py-8 text-center">
        {isFetchingNextPage
          ? "Загрузка..."
          : hasNextPage
          ? "Прокрутите вниз для загрузки новых"
          : "Больше нет локаций"}
      </div>
    </>
  );
};

export default LocationList;
