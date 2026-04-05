import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // data is fresh for 30 s
      gcTime: 5 * 60_000,         // keep unused cache for 5 min
      retry: 1,
      refetchOnWindowFocus: true, // re-fetch when user returns to tab
    },
  },
});
