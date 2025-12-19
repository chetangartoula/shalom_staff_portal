import { useQuery } from '@tanstack/react-query';
import { fetchExtraServices } from '@/lib/api-service';

// Custom hook to use extra services with React Query
export function useExtraServices(tripId: string = '32') {
  return useQuery<any[], Error>({
    queryKey: ['extraServices', tripId],
    queryFn: () => fetchExtraServices(tripId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests up to 2 times
    enabled: !!tripId, // Only fetch if tripId is provided
  });
}