import { useQuery } from '@tanstack/react-query';
import type { Trek } from '@/lib/types';
import { fetchTrips } from '@/lib/api-service';

// Custom hook to use trips with React Query
export function useTrips() {
  return useQuery<Trek[], Error>({
    queryKey: ['trips'],
    queryFn: async () => {
      const data = await fetchTrips();
      return data.trips;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry failed requests up to 2 times
  });
}