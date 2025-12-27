import { useQuery } from '@tanstack/react-query';
import { fetchFromAPI } from '@/lib/api-service';

interface UseAllAccommodations {
  tripId: string;
}

export const useAllAccommodations = (tripId: string) => {
  return useQuery({
    queryKey: ['all-accommodations', tripId],
    queryFn: async () => {
      if (!tripId) return [];
      
      try {
        const data = await fetchFromAPI<any[]>(`/staff/accommodation-list/${tripId}/`);
        
        // Transform the API response to match our expected structure
        const transformedAccommodations = data.map(accommodation => ({
          id: accommodation.id.toString(),
          name: accommodation.name,
          rate: parseFloat(accommodation.price), // Convert string price to number
          times: accommodation.times || 1, // Default to 1 if not provided
          per_person: accommodation.per_person || false,
          per_day: accommodation.per_day || false,
          one_time: accommodation.one_time || false,
          is_default: accommodation.is_default || false,
          is_editable: true, // Allow editing by default
          max_capacity: accommodation.max_capacity || null,
          from_place: accommodation.location || '',
          to_place: '' // No to_place in the API response
        }));
        
        return transformedAccommodations;
      } catch (error) {
        console.error('Error fetching all accommodations:', error);
        throw error;
      }
    },
    enabled: !!tripId,
  });
};