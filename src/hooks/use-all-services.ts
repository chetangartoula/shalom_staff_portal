import { useQuery } from '@tanstack/react-query';
import { fetchServices } from '@/lib/api-service';

// Custom hook to use all services with React Query
export function useAllServices(tripId: string) {
  return useQuery<any[], Error>({
    queryKey: ['all-services', tripId],
    queryFn: () => fetchServices(tripId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    enabled: !!tripId, // Only run the query if tripId is provided
  });
}