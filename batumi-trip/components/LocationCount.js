'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
/**
 * Отображает количество локаций для заданного направления
 * @param {{ directionId: string }} props
 */
export default function LocationCount({ directionId }) {
  const { data: count = 0, isLoading } = useQuery({
    queryKey: ['locationCount', directionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('locations')
        .select('id', { count: 'exact', head: true })
        .eq('direction_id', directionId);
      if (error) throw error;
      return count;
    },
    staleTime: 60_000,
  });

  return (
    <p className="inline-flex items-center bg-primary text-primary-foreground rounded-full text-sm font-semibold">
      {isLoading ? 'Загрузка…' : `${count}`}
    </p>
  );
}
