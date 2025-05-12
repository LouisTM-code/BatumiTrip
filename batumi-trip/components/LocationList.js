"use client";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useLocations } from "@/hooks/useLocations";
import SkeletonCard from "@/components/SkeletonCard";
import LocationCard from "@/components/LocationCard";
/**
 * LocationList — контейнер для списка карточек локаций.
 *
 * • Бесконечная прокрутка (useInfiniteQuery + Intersection Observer).
 * • Realtime‑подписка на INSERT / UPDATE / DELETE в таблице `locations`.
 *   ◦ INSERT — инвалидируем кэш, чтобы подтянуть новую локацию.
 *   ◦ UPDATE — патчим элемент в кэше без полного рефетча.
 *   ◦ DELETE — удаляем элемент из кэша.
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

  const { ref, inView } = useInView();
  const queryClient = useQueryClient();

  /* ---------- Infinite Scroll ---------- */
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  /* ---------- Realtime subscription ---------- */
  useEffect(() => {
    const channel = supabase
      .channel("realtime:locations-changes")
      // INSERT — просто инвалидируем, чтобы дошли новые записи
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "locations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["locations"] });
        }
      )
      // UPDATE — точечно патчим кэш, избегая полного запроса
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "locations" },
        ({ new: newRow }) => {
          queryClient.setQueriesData({ queryKey: ["locations"] }, (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((item) =>
                  item.id === newRow.id ? { ...item, ...newRow } : item
                ),
              })),
            };
          });
        }
      )
      // DELETE — удаляем карточку из кэша
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "locations" },
        ({ old: oldRow }) => {
          queryClient.setQueriesData({ queryKey: ["locations"] }, (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter((item) => item.id !== oldRow.id),
              })),
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  /* ---------- Render ---------- */
  if (isLoading) {
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
        {data.pages.map((page) =>
          page.items.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))
        )}
      </div>
      <div ref={ref} className="py-8 text-center">
        {isFetchingNextPage
          ? "Загрузка..."
          : hasNextPage
          ? "Прокрутите вниз для загрузки новых"
          : "Больше нет локаций"}
      </div>
    </>
  );
}
