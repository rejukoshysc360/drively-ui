import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 🚫 Prevent infinite retry loops on 401/403 errors
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;

        if (status === 401 || status === 403) {
          console.warn(`🛑 React Query stopped retrying (status ${status})`);
          return false; // stop immediately
        }

        // ✅ Retry up to 3 times for other transient issues (like 5xx / network)
        return failureCount < 3;
      },

      // 🧠 Keep your existing behavior
      refetchOnWindowFocus: false,

      // ✅ (optional but good) attempt reconnect if network drops
      refetchOnReconnect: true,

      // ✅ Keep results fresh for 1 minute
      staleTime: 60 * 1000,
    },

    // 🚫 Never retry mutations (POST, PATCH, DELETE)
    mutations: {
      retry: false,
    },
  },
});
