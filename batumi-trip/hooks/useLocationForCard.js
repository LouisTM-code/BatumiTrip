import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
/**
 * Custom hook to fetch up to 10 locations for a given direction and return a random sample of 3.
 * @param {string|null} directionId 
 * @returns {{id:string, title:string, image_url:string|null, direction_id:string}[]}
 */
export function useLocationForCard(directionId) {
  return useQuery({
    queryKey: ['locationsForCard', directionId],
    queryFn: async () => {
      if (!directionId) return [];
      const { data, error } = await supabase
        .from('locations')
        .select('id, title, image_url')
        .eq('direction_id', directionId)
        .limit(10);
      if (error) throw error;

      // Shuffle and pick 3
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3).map(item => ({
        ...item,
        direction_id: directionId,
      }));
    },
    enabled: Boolean(directionId),
    staleTime: 5 * 60_000, // 5 minutes
  });
}