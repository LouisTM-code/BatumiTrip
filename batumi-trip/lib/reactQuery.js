import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,       // 1 минута
        gcTime: 1000 * 60 * 30,  // 30 минут
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        networkMode: 'always',
      },
    },
  });
}