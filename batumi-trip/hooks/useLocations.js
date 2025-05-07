// hooks/useLocations.js
'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useUIStore } from '@/store/uiStore';

const PAGE_SIZE = 9;

/**
 * Кастомный хук загрузки списка локаций с учётом
 * поисковой строки и выбранных тегов из Zustand‑стора.
 * Реализован согласно StateManagement‑BatumiTrip.md § 5 (useLocations)
 * и ComponentsDesign‑BatumiTrip.md (описание useLocations).
 */
export function useLocations() {
  const searchQuery = useUIStore((s) => s.searchQuery);
  const selectedTags = useUIStore((s) => s.selectedTags);

  const fetchLocations = async ({ pageParam = null }) => {
    /**
     * Формируем запрос к Supabase REST через JS SDK.
     * Для cursor‑pagination используем поле created_at.
     */
    let query = supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    // Курсор: берём записи «старше» (меньше created_at)
    if (pageParam) {
      query = query.lt('created_at', pageParam);
    }

    // Поиск по заголовку (ilike, нечувствительно к регистру)
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // Фильтрация по выбранным тегам (JOIN locations_tags)
    if (selectedTags.length) {
      query = query
        .in(
          'id',
          supabase
            .from('locations_tags')
            .select('location_id')
            .in('tag_id', selectedTags)
        );
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      items: data,
      nextCursor:
        data.length === PAGE_SIZE ? data[data.length - 1].created_at : undefined,
    };
  };

  return useInfiniteQuery({
    queryKey: ['locations', { search: searchQuery, tags: selectedTags }],
    queryFn: fetchLocations,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000, // 1 минута (см. StateManagement‑BatumiTrip.md § 2.1)
  });
}