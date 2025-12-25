import { useQuery } from '@tanstack/react-query';
import { fetchExtraServices } from '@/lib/api-service';

// Custom hook to use all extra services with React Query
export function useAllExtraServices(tripId: string) {
  return useQuery<any[], Error>({
    queryKey: ['all-extra-services', tripId],
    queryFn: () => fetchExtraServices(tripId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    enabled: !!tripId, // Only run the query if tripId is provided
  });
}