import { useQuery } from '@tanstack/react-query';
import { fetchServices } from '@/lib/api-service';

// Custom hook to use services with React Query
export function useServices(tripId: string = '32') {
  return useQuery<any[], Error>({
    queryKey: ['services', tripId],
    queryFn: () => fetchServices(tripId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    enabled: !!tripId, // Only fetch if tripId is provided
  });
}