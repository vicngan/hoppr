import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client. Lives in `core/` so a future web build reuses the
 * exact same data layer.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
