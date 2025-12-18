import type { Trek } from '@/lib/types';

// Base URL for the external API
const BASE_URL = 'http://localhost:8000/api/v1';

// Generic fetch function with error handling
async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    console.log(`Fetching from API: ${BASE_URL}${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Received data from ${endpoint}:`, data);
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - the server took too long to respond');
    }
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

// Define the API response structure
interface APITrip {
  id: number;
  title: string;
  sub_title: string;
}

// Define interfaces for the new API responses
interface APIPermit {
  id: number;
  name: string;
  rate: string; // API returns rate as string
  times: number;
  is_active: boolean;
  order: number;
}

interface APIService {
  id: number;
  name: string;
  rate: string; // API returns rate as string
  times: number;
  max_num: number;
}

interface APIExtraServiceParam {
  name: string;
  rate: number;
}

interface APIExtraService {
  id: number;
  service_name: string;
  params: APIExtraServiceParam[];
  times: number;
}

// Fetch trips from the real API
export async function fetchTrips(): Promise<{ trips: Trek[] }> {
  try {
    const data = await fetchFromAPI<{ trips: APITrip[] }>('/staff/trip-list/');
    
    // Transform the API response to match our Trek type
    const transformedTrips: Trek[] = data.trips.map(trip => ({
      id: trip.id.toString(),
      name: trip.title,
      description: trip.sub_title,
      permits: [] // Permits would need to be fetched separately or added manually
    }));
    
    return { trips: transformedTrips };
  } catch (error) {
    throw error;
  }
}

// Fetch permits for a specific trip
export async function fetchPermits(tripId: string): Promise<any[]> {
  try {
    const data = await fetchFromAPI<APIPermit[]>(`/staff/permit-list/${tripId}/`);
    
    // Transform the API response to match our Permit type
    const transformedPermits = data.map(permit => ({
      id: permit.id.toString(),
      name: permit.name,
      rate: parseFloat(permit.rate), // Convert string rate to number
      times: permit.times
    }));
    
    return transformedPermits;
  } catch (error) {
    throw error;
  }
}

// Fetch services for a specific trek
export async function fetchServices(tripId: string = '32'): Promise<any[]> {
  try {
    const data = await fetchFromAPI<APIService[]>(`/staff/service-list/${tripId}/`);
    
    // Transform the API response to match our Service type
    const transformedServices = data.map(service => ({
      id: service.id.toString(),
      name: service.name,
      rate: parseFloat(service.rate), // Convert string rate to number
      times: service.times
    }));
    
    return transformedServices;
  } catch (error) {
    throw error;
  }
}

// Fetch extra services for a specific trek
export async function fetchExtraServices(tripId: string = '32'): Promise<any[]> {
  try {
    const data = await fetchFromAPI<APIExtraService[]>(`/staff/extra-service-list/${tripId}/`);
    
    // Transform the API response
    const transformedExtraServices = data.map(extraService => ({
      id: extraService.id.toString(),
      serviceName: extraService.service_name,
      params: extraService.params,
      times: extraService.times
    }));
    
    return transformedExtraServices;
  } catch (error) {
    throw error;
  }
}
