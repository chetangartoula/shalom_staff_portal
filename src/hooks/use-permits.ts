import { useQuery } from '@tanstack/react-query';
import { fetchPermits } from '@/lib/api-service';

// Custom hook to use permits with React Query
export function usePermits(tripId: string) {
  return useQuery<any[], Error>({
    queryKey: ['permits', tripId],
    queryFn: () => fetchPermits(tripId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    enabled: !!tripId, // Only fetch if tripId is provided
  });
}