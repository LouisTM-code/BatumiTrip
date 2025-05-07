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
      .select('*, locations_tags(tag_id, tags(name))')
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
      const {data: tagRows, error: tagError } = await supabase
        .from('tags')
        .select('id,name')
        .in('name', selectedTags);
      if (tagError) throw tagError;
      const tagIds = tagRows.map((t) => t.id);
      query = query.in('locations_tags.tag_id', tagIds);
    }

    const { data, error } = await query;
    console.log('got', data.length, 'items; last created_at =', data[data.length-1]?.created_at);
    if (error) throw error;

    // Преобразуем сырой ответ, вынося из relations только массив имён тегов
    const items = data.map(({ locations_tags, ...loc }) => ({
    ...loc,
    tags: locations_tags.map((lt) => lt.tags.name),
    }));

    return {
      items,
      nextCursor:
        data.length === PAGE_SIZE ? data[data.length - 1].created_at : undefined,
    };
  };

  return useInfiniteQuery({
    queryKey: ['locations', { search: searchQuery, tags: selectedTags }],
    queryFn: fetchLocations,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });
}