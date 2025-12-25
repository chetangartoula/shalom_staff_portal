import { useQuery } from '@tanstack/react-query';
import { fetchAllPermits } from '@/lib/api-service';

// Custom hook to use all permits with React Query
export function useAllPermits(tripId: string) {
  return useQuery<any[], Error>({
    queryKey: ['all-permits', tripId],
    queryFn: () => fetchAllPermits(tripId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    enabled: !!tripId, // Only run the query if tripId is provided
  });
}