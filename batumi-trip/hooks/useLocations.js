// src/hooks/useLocations.js
'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useUIStore } from '@/store/uiStore';

const PAGE_SIZE = 9;

export function useLocations() {
  // Глобальные фильтры из Zustand
  const searchQuery = useUIStore((s) => s.searchQuery);
  const selectedTags = useUIStore((s) => s.selectedTags);
  const activeDirectionId = useUIStore((s) => s.activeDirectionId);

  const fetchLocations = async ({ pageParam = null }) => {
    // Базовый запрос — выборка локаций с тегами
    let query = supabase
      .from('locations')
      .select('*, locations_tags(tag_id, tags(name))')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    // Фильтрация по активному направлению, если задано
    if (activeDirectionId) {
      query = query.eq('direction_id', activeDirectionId);
    }

    // Пагинация курсором
    if (pageParam) {
      query = query.lt('created_at', pageParam);
    }

    // Поиск по заголовку
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // Фильтрация по выбранным тегам
    if (selectedTags.length) {
      const { data: tagRows, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .in('name', selectedTags);
      if (tagError) throw tagError;
      const tagIds = tagRows.map((t) => t.id);
      query = query.in('locations_tags.tag_id', tagIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Трансформация данных: приводим к виду с полями imgUrl и tags[]
    const items = data.map(({ locations_tags, ...loc }) => ({
      ...loc,
      imgUrl: loc.image_url,
      tags: locations_tags.map((lt) => lt.tags.name),
    }));

    return {
      items,
      nextCursor:
        data.length === PAGE_SIZE ? data[data.length - 1].created_at : undefined,
    };
  };

  return useInfiniteQuery({
    // Включаем activeDirectionId в ключ кэша
    queryKey: [
      'locations',
      {
        dir: activeDirectionId ?? '__root__',
        search: searchQuery,
        tags: selectedTags,
      },
    ],
    queryFn: fetchLocations,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000, // 1 минута
  });
}
