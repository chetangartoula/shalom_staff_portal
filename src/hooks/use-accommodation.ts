import { useQuery } from '@tanstack/react-query';
import { fetchFromAPI } from '@/lib/api-service';

export const useAccommodation = (tripId: string) => {
  return useQuery({
    queryKey: ['accommodation', tripId],
    queryFn: async () => {
      if (!tripId) return [];

      try {
        const data = await fetchFromAPI<any[]>(`/staff/accommodation-list/${tripId}/`);

        // Transform the API response to match our expected structure
        const transformedAccommodation = data.map((accommodation: any) => ({
          id: accommodation.id.toString(),
          name: accommodation.name,
          rate: parseFloat(accommodation.price), // Convert string price to number
          times: accommodation.times || 1, // Default to 1 if not provided
          per_person: accommodation.per_person || false,
          per_day: accommodation.per_day || false,
          one_time: accommodation.one_time || false,
          is_default: accommodation.is_default || false,
          is_compulsory: accommodation.is_compulsory || false,
          is_editable: true, // Allow editing by default
          max_capacity: accommodation.max_capacity || null,
          from_place: accommodation.location || '',
          to_place: '', // No to_place in the API response
        }));

        return transformedAccommodation;
      } catch (error) {
        console.error('Error fetching accommodation:', error);
        throw error;
      }
    },
    enabled: !!tripId,
  });
};