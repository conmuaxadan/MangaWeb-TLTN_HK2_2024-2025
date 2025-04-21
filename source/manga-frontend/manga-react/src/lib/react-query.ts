import { QueryClient } from '@tanstack/react-query';

// Tạo QueryClient với cấu hình mặc định
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 phút
      cacheTime: 300000, // 5 phút
      retry: 1,
      refetchOnWindowFocus: false, // Không refetch khi focus lại tab
    },
  },
});
