import { useQuery } from '@tanstack/react-query';
import { fetchFromAPI } from '@/lib/api-service';

export const useTransportation = (tripId: string) => {
  return useQuery({
    queryKey: ['transportation', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      try {
        const data = await fetchFromAPI<any[]>(`/staff/transportation-list/${tripId}/`);
        
        // Transform the API response to match our expected structure
        const transformedTransportation = data.map((transportation: any) => ({
          id: transportation.id.toString(),
          name: transportation.name,
          rate: parseFloat(transportation.price), // Convert string price to number
          times: transportation.times || 1, // Default to 1 if not provided
          per_person: transportation.per_person || false,
          per_day: transportation.per_day || false,
          one_time: transportation.one_time || false,
          is_default: transportation.is_default || false,
          is_editable: true, // Allow editing by default
          max_capacity: transportation.max_capacity || null,
          from_place: transportation.departure_point || '',
          to_place: transportation.arrival_point || ''
        }));
        
        return transformedTransportation;
      } catch (error) {
        console.error('Error fetching transportation:', error);
        throw error;
      }
    },
    enabled: !!tripId,
  });
};