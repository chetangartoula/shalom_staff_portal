import type { Trek, Report } from '@/lib/types';
import type {
  APITrip,
  APIPermit,
  APIService,
  APIExtraService,
  APIGuide,
  APIPorter,
  APIAssignment,
  APIGroupAndPackage,
  APITransactionsResponse,
  APITransaction,
  APIMergedPackage, 
  APIMergePackagesResponse,
  APICreateTravelerRequest,
  APITraveler,
  APIDashboardStats,APIAssignTeamResponse,APIPaymentDetailResponse,APIPaymentRequest
} from '@/lib/api-types';
import { getAccessToken, clearAuthTokens, isAccessTokenExpired, getRefreshToken } from '@/lib/auth-utils';

// Authentication types
export interface OtpRequestResponse {
  message: string;
  user_id: number;
  otp_id: string; // For development purposes only
}

export interface OtpVerifyResponse {
  refresh: string;
  access: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_active: boolean;
  };
}

export interface RefreshTokenResponse {
  access: string;
}

// Base URL for the external API - use environment variable with fallback
const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1`;

// Lightweight in-memory request coordination and caching
const IN_FLIGHT_REQUESTS = new Map<string, Promise<any>>();
const GET_RESPONSE_CACHE = new Map<string, { expiry: number; data: any }>();
const DEFAULT_GET_CACHE_TTL_MS = 30_000; // 30 seconds

function buildCacheKey(endpoint: string, options: RequestInit = {}): string {
  const method = (options.method || 'GET').toUpperCase();
  // Only include serializable parts likely to affect response identity
  const body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body || null);
  return `${method} ${endpoint} ${body ?? ''}`;
}

// A distinct error type so callers can handle session expiry explicitly
export class SessionExpiredError extends Error {
  constructor(message: string = 'Session expired. Please log in again.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

// Server-side helpers for SSR where we can supply a token explicitly
export async function serverFetchGuides(token: string): Promise<{ guides: APIGuide[] }> {
  return await serverFetchFromAPI<{ guides: APIGuide[] }>(`/staff/guides/`, token);
}

export async function serverFetchPorters(token: string): Promise<{ porters: APIPorter[] }> {
  return await serverFetchFromAPI<{ porters: APIPorter[] }>(`/staff/porters/`, token);
}

export async function serverFetchAssignedTeam(packageId: number, token: string): Promise<APIAssignTeamResponse> {
  return await serverFetchFromAPI<APIAssignTeamResponse>(`/staff/assign-teams/${packageId}/`, token);
}

// Centralized session-expired handler: clears tokens and redirects to login.
// Returns a never-resolving promise on the client to prevent noisy errors after redirect.
function handleSessionExpired<T>(): Promise<T> {
  clearAuthTokens();
  if (typeof window !== 'undefined') {
    const redirectPath = window.location.pathname + window.location.search;
    window.location.replace(`/login?session_expired=true&redirect=${encodeURIComponent(redirectPath)}`);
    // Return a promise that never resolves to stop further processing on the page
    return new Promise<T>(() => {});
  }
  // On the server, propagate an explicit error so SSR can handle it
  return Promise.reject(new SessionExpiredError());
}

// Helper function to calculate row total based on boolean flags
function calculateRowTotal(item: any, no: number, times: number): number {
  const rate = Number(item.rate) || 0;
  
  // Apply calculation based on boolean flags
  if (item.one_time) {
    // If one_time is true, the total is just the rate (single occurrence regardless of other factors)
    return rate;
  } else {
    // For non-one_time items, use the calculated no and times values
    return rate * no * times;
  }
}

// Helper function to calculate row quantity based on max_capacity and per_person
function calculateRowQuantity(item: any, groupSize: number): number {
  if (item.one_time) {
    // If one_time is true, quantity is always 1 regardless of other factors
    return 1;
  }
  
  if (item.max_capacity && item.max_capacity > 0) {
    // Calculate quantity based on max_capacity
    return Math.ceil(groupSize / item.max_capacity);
  }

  if (item.per_person) {
    return groupSize;
  }

  return 1;
}

// Generic fetch function with error handling
// Generic fetch function with error handling
// Replace the fetchFromAPI function with this corrected version

export async function fetchFromAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = buildCacheKey(endpoint, options);

  const noStore = (options as any)?.cache === 'no-store';

  // Serve from short-lived cache for GET requests
  if (method === 'GET' && !noStore) {
    const cached = GET_RESPONSE_CACHE.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
  }

  // De-duplicate identical in-flight requests (unless no-store)
  if (!noStore) {
    const existing = IN_FLIGHT_REQUESTS.get(cacheKey);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const requestPromise: Promise<T> = (async () => {
    const controller = new AbortController();
    const TIMEOUT_MS = 30000; // 30 seconds timeout
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // 1. Determine if we're on the client or server and get appropriate token
      let token: string | null = null;
      let isServer = typeof window === 'undefined';
      let isRefreshed = false;

      if (isServer) {
        // Server-side: try to read Authorization header from the current Next.js request context
        try {
          const nextHeadersModule = await import('next/headers');
          const reqHeaders = await nextHeadersModule.headers();
          const authHeader = reqHeaders.get('authorization') || reqHeaders.get('Authorization');
          if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim();
          } else {
            token = null;
          }
        } catch {
          // If next/headers is unavailable (e.g., non-Next server context), proceed without token
          token = null;
        }
      } else {
        // Client-side: use localStorage-based authentication
        if (isAccessTokenExpired()) {
          try {
            const refreshResult = await refreshToken();
            if (refreshResult) {
              token = getAccessToken();
              isRefreshed = true;
            } else {
              // No refresh token available, redirect to login
              return handleSessionExpired<T>();
            }
          } catch (error) {
            return handleSessionExpired<T>();
          }
        } else {
          token = getAccessToken();
        }
      }

      // 2. Set up headers
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // 3. Make the request
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
      });

      // 4. Handle 401 Unauthorized responses
      if (response.status === 401) {
        // Check if we're on server or client for refresh token check
        let refreshTokenAvailable = isServer ? null : getRefreshToken(); // Server-side refresh token handling is different
        
        // If we already tried to refresh, or there's no refresh token
        if (isRefreshed || !refreshTokenAvailable) {
          return handleSessionExpired<T>();
        }

        // Try to refresh the token and retry once
        try {
          if (isServer) {
            // Server-side token refresh is handled differently in API routes
            // For now, we'll return session expired since we can't refresh server-side tokens here
            return handleSessionExpired<T>();
          } else {
            const refreshResult = await refreshToken();
            if (refreshResult) {
              token = getAccessToken();
              if (token) {
                headers.set('Authorization', `Bearer ${token}`);
                const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
                  ...options,
                  signal: controller.signal,
                  headers,
                });
                return await handleResponse<T>(retryResponse);
              }
            }
          }
          return handleSessionExpired<T>();
        } catch (error) {
          return handleSessionExpired<T>();
        }
      }

      // 5. Handle the response
      return await handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        // Handle network errors
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        
        // Handle network connectivity issues
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Unable to connect to the server. Please check your internet connection.');
        }
        
        // Re-throw the original error if it's already meaningful (from handleResponse)
        if (error.message) {
          throw error;
        }
        
        // Fallback generic message
        throw new Error('An unexpected error occurred while processing your request.');
      }
      
      // Fallback for non-Error throws
      throw new Error('An unexpected error occurred');
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  if (!noStore) {
    IN_FLIGHT_REQUESTS.set(cacheKey, requestPromise);
  }

  try {
    const result = await requestPromise;
    if (method === 'GET' && !noStore) {
      GET_RESPONSE_CACHE.set(cacheKey, { expiry: Date.now() + DEFAULT_GET_CACHE_TTL_MS, data: result });
    }
    // On mutating requests, invalidate related GET cache entries for this endpoint
    if (method !== 'GET') {
      const prefix = `GET ${endpoint}`;
      for (const key of Array.from(GET_RESPONSE_CACHE.keys())) {
        if (key.startsWith(prefix)) {
          GET_RESPONSE_CACHE.delete(key);
        }
      }
    }
    return result;
  } finally {
    if (!noStore) {
      IN_FLIGHT_REQUESTS.delete(cacheKey);
    }
  }
}

// Helper function to handle response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    
    try {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } catch (e) {
      // If we can't parse the error, use the status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  // Handle 204 No Content or empty responses
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined as unknown as T;
  }

  try {
    return await response.json();
  } catch (error) {
    // If we can't parse the response as JSON but the request was successful,
    // return an empty object (useful for endpoints that don't return content)
    if (response.ok) {
      return {} as T;
    }
    throw new Error('Failed to parse response as JSON');
  }
}

// Fetch guides from the real API
export async function fetchGuides(): Promise<{ guides: any[] }> {
  try {
    const data = await fetchFromAPI<{ guides: APIGuide[] }>('/staff/guides/');

    // Transform the API response to match our Guide type
    const transformedGuides = data.guides.map(guide => ({
      id: guide.id.toString(),
      name: guide.name,
      phone: guide.phone,
      email: guide.email,
      status: guide.status as any // Assuming the API returns valid status values
    }));

    return { guides: transformedGuides };
  } catch (error) {
    console.error('Error fetching guides:', error);
    throw error;
  }
}

// Fetch porters from the real API
export async function fetchPorters(): Promise<{ porters: any[] }> {
  try {
    const data = await fetchFromAPI<{ porters: APIPorter[] }>('/staff/porters/');

    // Transform the API response to match our Porter type
    const transformedPorters = data.porters.map(porter => ({
      id: porter.id.toString(),
      name: porter.name,
      phone: porter.phone,
      status: porter.status as any // Assuming the API returns valid status values
    }));

    return { porters: transformedPorters };
  } catch (error) {
    console.error('Error fetching porters:', error);
    throw error;
  }
}

// Fetch airport pickup personnel from the real API
export async function fetchAirportPickUp(): Promise<{ airportPickUp: any[] }> {
  try {
    // Since there's no dedicated endpoint, we'll fetch assignments and extract airport pickup data
    const assignmentsData = await fetchAssignments();

    // Extract all unique airport pickup personnel from assignments
    const allAirportPickUp = assignmentsData.assignments
      .flatMap((assignment: any) => assignment.airportPickUp)
      .filter((pickup: any, index: number, self: any[]) =>
        index === self.findIndex((p: any) => p.id === pickup.id)
      );

    // If no airport pickup data found in assignments, return empty array
    // In a real implementation, there might be a dedicated endpoint
    return { airportPickUp: allAirportPickUp };
  } catch (error) {
    console.error('Error fetching airport pickup data:', error);
    throw error;
  }
}

// Fetch assignments from the real API
export async function fetchAssignments(): Promise<{ assignments: any[] }> {
  try {
    const data = await fetchFromAPI<APIAssignment[]>('/staff/assignments/');

    // Transform the API response to match our Assignment type
    const transformedAssignments = data.map(assignment => ({
      groupId: assignment.groupId.toString(),
      trekName: assignment.trekName,
      groupName: assignment.groupName,
      startDate: assignment.startDate,
      guides: assignment.guides.map(guide => ({
        id: guide.id.toString(),
        name: guide.name,
        phone: guide.phone,
        email: guide.email,
        status: guide.status as any
      })),
      porters: assignment.porters.map(porter => ({
        id: porter.id.toString(),
        name: porter.name,
        phone: porter.phone,
        status: porter.status as any
      })),
      airportPickUp: assignment.airportPickUp
    }));

    return { assignments: transformedAssignments };
  } catch (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }
}

// Assign team members to a package
export async function assignTeam(guides: number[], porters: number[], packageId: number): Promise<any> {
  try {
    const payload = {
      guides: guides,
      porters: porters,
      package: packageId
    };

    console.log('Sending assign team payload:', JSON.stringify(payload, null, 2));

    // Determine token depending on environment (server vs client)
    let token: string | null = null;
    if (typeof window === 'undefined') {
      try {
        const nextHeadersModule = await import('next/headers');
        const reqHeaders = await nextHeadersModule.headers();
        const authHeader = reqHeaders.get('authorization') || reqHeaders.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7).trim();
        }
      } catch {}
    } else {
      token = getAccessToken();
    }

    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
        
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
        
    const response = await fetch(`${BASE_URL}/staff/assign-teams/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Assign team response:', data);

    return data;
  } catch (error) {
    console.error('Error assigning team:', error);
    throw error;
  }
}

// Fetch assigned team for a specific package
export async function fetchAssignedTeam(packageId: number): Promise<APIAssignTeamResponse> {
  try {
    const data = await fetchFromAPI<APIAssignTeamResponse>(`/staff/assign-teams/${packageId}/`);
    return data;
  } catch (error: any) {
    // Handle 404 errors specifically - this is expected when no assignment exists yet
    if (error.message && (error.message.includes('404') || error.message.includes('Resource not found'))) {
      console.log(`No assignment found for package ${packageId} - this is expected for new assignments`);
      // Return a default structure when no assignment exists
      return {
        id: 0,
        guides: [],
        porters: [],
        package: packageId
      } as APIAssignTeamResponse;
    }
    console.error('Error fetching assigned team:', error);
    throw error;
  }
}

// Fetch trips from the real API
export async function fetchTrips(): Promise<{ trips: Trek[] }> {
  try {
    const data = await fetchFromAPI<{ trips: APITrip[] }>('/staff/trip-list/');

    // Transform the API response to match our Trek type
    const transformedTrips: Trek[] = data.trips.map(trip => ({
      id: trip.id.toString(),
      name: trip.title,
      description: trip.combined_info,
      times: trip.times || 1,
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
      times: permit.times,
      per_person: permit.per_person,
      per_day: permit.per_day,
      one_time: permit.one_time,
      is_default: permit.is_default,
      is_compulsory: permit.is_compulsory,
      is_editable: permit.is_editable,
      max_capacity: permit.max_capacity,
      from_place: permit.from_place,
      to_place: permit.to_place
    }));

    return transformedPermits;
  } catch (error) {
    throw error;
  }
}

// Fetch all permits for a specific trip
export async function fetchAllPermits(tripId: string): Promise<any[]> {
  try {
    const data = await fetchFromAPI<APIPermit[]>(`/staff/permit-list/${tripId}/`);

    // Transform the API response to match our Permit type
    const transformedPermits = data.map(permit => ({
      id: permit.id.toString(),
      name: permit.name,
      rate: parseFloat(permit.rate), // Convert string rate to number
      times: permit.times,
      per_person: permit.per_person,
      per_day: permit.per_day,
      one_time: permit.one_time,
      is_default: permit.is_default,
      is_compulsory: permit.is_compulsory,
      is_editable: permit.is_editable,
      max_capacity: permit.max_capacity,
      from_place: permit.from_place,
      to_place: permit.to_place
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
      times: service.times,
      // Add the same properties as permits for consistency
      per_person: service.per_person || false,
      per_day: service.per_day || false,
      one_time: service.one_time || false,
      is_default: service.is_default || false,
      is_editable: service.is_editable || true,
      max_capacity: service.max_num,
      from_place: service.from_place || '',
      to_place: service.to_place || ''
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

    // Transform the API response - flatten the params structure to make each param a separate service
    const transformedExtraServices = data.flatMap(extraService => {
      return extraService.params.map(param => ({
        id: `${extraService.id}-${param.name.replace(/\s+/g, '-')}`, // Create unique ID
        serviceName: extraService.service_name,
        name: param.name,
        description: `${extraService.service_name} - ${param.name}`,
        rate: parseFloat(param.rate.toString()),
        times: extraService.times,
        // Use the param-level properties if available, fallback to service-level
        per_person: param.per_person !== undefined ? param.per_person : (extraService.per_person || false),
        per_day: param.per_day !== undefined ? param.per_day : (extraService.per_day || false),
        one_time: param.one_time !== undefined ? param.one_time : (extraService.one_time || false),
        is_default: param.is_default !== undefined ? param.is_default : (extraService.is_default || false),
        is_editable: param.is_editable !== undefined ? param.is_editable : (extraService.is_editable || true),
        max_capacity: param.max_capacity !== undefined ? param.max_capacity : (extraService.max_num || null),
        from_place: param.from_place || extraService.from_place || '',
        to_place: param.to_place || extraService.to_place || ''
      }));
    });

    return transformedExtraServices;
  } catch (error) {
    throw error;
  }
}

// Server-side refresh token function
async function serverRefreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to refresh token: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = `${response.status}: ${errorData.detail}`;
      }
    } catch (e) {
      // If we can't parse the error response, use the status code
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

// Server-side helper to fetch payment details with a provided access token
export async function serverFetchPaymentDetails(groupId: string, token: string): Promise<APIPaymentDetailResponse> {
  return await serverFetchFromAPI<APIPaymentDetailResponse>(`/staff/payment-detail/${groupId}/`, token);
}

// Server-side fetch function for API requests with token
async function serverFetchFromAPI<T>(endpoint: string, token: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If we get a 401, try to refresh the token and retry the request
    if (response.status === 401) {
      // Note: In a real server-side implementation, you would need to pass the refresh token as well
      // For now, we'll just throw the error since we can't refresh without the refresh token
      throw new Error(`Token expired and unable to refresh: ${response.status}`);
    }
    
    let errorMessage = `API request failed with status ${response.status} for ${endpoint}`;
    
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = `${response.status}: ${errorData.detail}`;
      }
    } catch (e) {
      // If we can't parse the error response, use the status code
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

// Transform API response to match our Report type
function transformApiResponse(data: APIGroupAndPackage[]) {
  // Transform the API response to match our Report type
  const transformedReports = data.map(item => ({
    groupId: item.id.toString(),
    trekId: item.package.trip.toString(),
    trekName: item.package.name, // We might need to fetch the actual trek name separately
    groupName: item.package.name,
    groupSize: item.package.total_space,
    startDate: item.package.start_date,
    permits: {
        id: 'permits',
        name: 'Permits & Documents',
        rows: item.permits.map((permit, index) => {
          // Calculate quantity based on group size and max_capacity
          const calculatedNo = calculateRowQuantity(permit, item.package.total_space);
          // Calculate times based on package duration and per_day flag
          const calculatedTimes = permit.per_day ? item.package.times : 1;
          // Calculate total based on flags
          const calculatedTotal = calculateRowTotal(permit, calculatedNo, calculatedTimes);
              
          return {
            id: `permit-${index}`,
            description: permit.name,
            rate: permit.rate,
            no: calculatedNo,
            times: calculatedTimes,
            per_person: permit.per_person,
            per_day: permit.per_day,
            one_time: permit.one_time,
            max_capacity: permit.max_capacity,
            is_default: permit.is_default,
            is_editable: permit.is_editable,
            from_place: permit.from_place,
            to_place: permit.to_place,
            total: calculatedTotal
          };
        }),
        discountType: item.permit_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.permit_discount),
        discountRemarks: item.permit_discount_remarks
      },
      services: {
        id: 'services',
        name: 'Services',
        rows: item.services.map((service, index) => {
          // Calculate quantity based on group size and max_capacity
          const calculatedNo = calculateRowQuantity(service, item.package.total_space);
          // Calculate times based on package duration and per_day flag
          const calculatedTimes = service.per_day ? item.package.times : 1;
          // Calculate total based on flags
          const calculatedTotal = calculateRowTotal(service, calculatedNo, calculatedTimes);
              
          return {
            id: `service-${index}`,
            description: service.name,
            rate: service.rate,
            no: calculatedNo,
            times: calculatedTimes,
            per_person: service.per_person,
            per_day: service.per_day,
            one_time: service.one_time,
            max_capacity: service.max_capacity,
            is_default: service.is_default,
            is_editable: service.is_editable,
            from_place: service.from_place,
            to_place: service.to_place,
            total: calculatedTotal
          };
        }),
        discountType: item.service_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.service_discount),
        discountRemarks: item.service_discount_remarks
      },
      extraDetails: {
        id: 'extraDetails',
        name: 'Extra Details',
        rows: item.extra_services.flatMap((extraService, serviceIndex) =>
          extraService.params.map((param, paramIndex) => {
            // Calculate quantity based on group size and max_capacity
            const calculatedNo = calculateRowQuantity(param, item.package.total_space);
            // Calculate times based on package duration and per_day flag
            const calculatedTimes = param.per_day ? item.package.times : 1;
            // Calculate total based on flags
            const calculatedTotal = calculateRowTotal(param, calculatedNo, calculatedTimes);
                
            return {
              id: `extra-${serviceIndex}-${paramIndex}`,
              description: `${extraService.service_name} - ${param.name}`,
              rate: param.rate,
              no: calculatedNo,
              times: calculatedTimes,
              per_person: param.per_person,
              per_day: param.per_day,
              one_time: param.one_time,
              max_capacity: param.max_capacity,
              is_default: param.is_default,
              is_editable: param.is_editable,
              from_place: param.from_place,
              to_place: param.to_place,
              total: calculatedTotal
            };
          })
        ),
        discountType: item.extra_service_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.extra_service_discount),
        discountRemarks: item.extra_service_discount_remarks
      },
      accommodation: {
        id: 'accommodation',
        name: 'Accommodation',
        rows: item.accommodation?.map((acc, index) => {
          // Calculate quantity based on group size and max_capacity
          const calculatedNo = calculateRowQuantity(acc, item.package.total_space);
          // Calculate times based on package duration and per_day flag
          const calculatedTimes = acc.per_day ? item.package.times : 1;
          // Calculate total based on flags
          const calculatedTotal = calculateRowTotal(acc, calculatedNo, calculatedTimes);
          
          return {
            id: `accommodation-${index}`,
            description: acc.name,
            rate: acc.rate,
            no: calculatedNo,
            times: calculatedTimes,
            per_person: acc.per_person,
            per_day: acc.per_day,
            one_time: acc.one_time,
            max_capacity: acc.max_capacity,
            is_default: acc.is_default,
            is_editable: acc.is_editable,
            from_place: acc.from_place,
            to_place: acc.to_place,
            total: calculatedTotal
          };
        }) || [],
        discountType: item.accommodation_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.accommodation_discount || '0'),
        discountRemarks: item.accommodation_discount_remarks
      },
      transportation: {
        id: 'transportation',
        name: 'Transportation',
        rows: item.transportation?.map((trans, index) => {
          // Calculate quantity based on group size and max_capacity
          const calculatedNo = calculateRowQuantity(trans, item.package.total_space);
          // Calculate times based on package duration and per_day flag
          const calculatedTimes = trans.per_day ? item.package.times : 1;
          // Calculate total based on flags
          const calculatedTotal = calculateRowTotal(trans, calculatedNo, calculatedTimes);
          
          return {
            id: `transportation-${index}`,
            description: trans.name,
            rate: trans.rate,
            no: calculatedNo,
            times: calculatedTimes,
            per_person: trans.per_person,
            per_day: trans.per_day,
            one_time: trans.one_time,
            max_capacity: trans.max_capacity,
            is_default: trans.is_default,
            is_editable: trans.is_editable,
            from_place: trans.from_place,
            to_place: trans.to_place,
            total: calculatedTotal
          };
        }) || [],
        discountType: item.transportation_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.transportation_discount || '0'),
        discountRemarks: item.transportation_discount_remarks
      },
      customSections: [],
      serviceCharge: parseFloat(item.service_charge) || 0,
      reportUrl: `/report/${item.id}`, // Removed window.location.origin
      clientCommunicationMethod: '',
      overallDiscountType: item.overall_discount_type === 'percentage' ? 'percentage' : 'amount',
      overallDiscountValue: parseFloat(item.overall_discount),
      overallDiscountRemarks: item.overall_discount_remarks,
      createdBy: 'API User', // This would need to be fetched from the API or set differently
      joined: 0, // This would need to be fetched from the API or calculated
      pending: item.package.total_space, // This would need to be fetched from the API or calculated
      paymentDetails: {
        totalCost: item.total_cost,
        totalPaid: item.total_paid || 0, // Use total_paid from API response
        balance: item.total_cost - (item.total_paid || 0), // Calculate balance
        paymentStatus: (() => {
          const totalCost = item.total_cost;
          const totalPaid = item.total_paid || 0;
          const balance = totalCost - totalPaid;
          const epsilon = 0.01; // Tolerance for floating point inaccuracies

          if (totalPaid === 0) return 'unpaid';
          if (Math.abs(balance) <= epsilon || balance < 0) {
            return totalPaid > totalCost ? 'overpaid' : 'fully paid';
          }
          return 'partially paid';
        })()
      }
    }));

    return {
      reports: transformedReports,
      total: data.length, // This should be the total count from the API
      hasMore: data.length === 10 // This should be determined by the API - assume 10 per page for now
    };
  }


// Fetch groups and packages from the real API
export async function fetchGroupsAndPackages(page: number = 1, limit: number = 10, token?: string): Promise<{
  reports: any[];
  total: number;
  hasMore: boolean
}> {
  try {
    // Use a server-side fetch function when token is provided
    if (token) {
      const data = await serverFetchFromAPI<APIGroupAndPackage[]>(`/staff/groups-and-package/?page=${page}&limit=${limit}`, token);
      return transformApiResponse(data);
    } else {
      // If no token is provided, try to use the client-side function which will handle auth
      const data = await fetchFromAPI<APIGroupAndPackage[]>(`/staff/groups-and-package/?page=${page}&limit=${limit}`);
      return transformApiResponse(data);
    }
  } catch (error) {
    console.error('Error fetching groups and packages:', error);
    // If the error is related to authentication, throw a specific error
    if (error instanceof Error && error.message.includes('Authentication required')) {
      throw error;
    }
    // For other errors, re-throw as is
    throw error;
  }
}

// Fetch a single group and package from the real API
// Helper to transform API response to Report type
function transformAPIGroupToReport(item: APIGroupAndPackage, isExtraInvoice: boolean = false, parentGroupId?: string): Report {
  return {
    isExtraInvoice,
    parentGroupId,
    groupId: isExtraInvoice ? (item.package?.id?.toString() || item.id.toString()) : item.id.toString(),
    trekId: item.package?.trip?.toString() || '0',
    trekName: item.package?.name || 'Unknown Trek',
    groupName: item.package?.name || 'Unknown Group',
    groupSize: item.package?.total_space || 0,
    startDate: item.package?.start_date || new Date().toISOString(),
    permits: {
      id: 'permits',
      name: 'Permits & Documents',
      rows: item.permits.map((permit, index) => {
        // Calculate quantity based on group size and max_capacity
        const calculatedNo = calculateRowQuantity(permit, item.package.total_space);
        // Calculate times based on package duration and per_day flag
        const calculatedTimes = permit.per_day ? item.package.times : 1;
        // Calculate total based on flags
        const calculatedTotal = calculateRowTotal(permit, calculatedNo, calculatedTimes);
        
        return {
          id: `permit-${index}`,
          description: permit.name,
          rate: permit.rate,
          no: calculatedNo,
          times: calculatedTimes,
          per_person: permit.per_person,
          per_day: permit.per_day,
          one_time: permit.one_time,
          max_capacity: permit.max_capacity,
          is_default: permit.is_default,
          is_editable: permit.is_editable,
          from_place: permit.from_place,
          to_place: permit.to_place,
          total: calculatedTotal
        };
      }),
      discountType: item.permit_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.permit_discount || '0'),
      discountRemarks: item.permit_discount_remarks
    },
    services: {
      id: 'services',
      name: 'Services',
      rows: item.services.map((service, index) => {
        // Calculate quantity based on group size and max_capacity
        const calculatedNo = calculateRowQuantity(service, item.package.total_space);
        // Calculate times based on package duration and per_day flag
        const calculatedTimes = service.per_day ? item.package.times : 1;
        // Calculate total based on flags
        const calculatedTotal = calculateRowTotal(service, calculatedNo, calculatedTimes);
        
        return {
          id: `service-${index}`,
          description: service.name,
          rate: service.rate,
          no: calculatedNo,
          times: calculatedTimes,
          per_person: service.per_person,
          per_day: service.per_day,
          one_time: service.one_time,
          max_capacity: service.max_capacity,
          is_default: service.is_default,
          is_editable: service.is_editable,
          from_place: service.from_place,
          to_place: service.to_place,
          total: calculatedTotal
        };
      }),
      discountType: item.service_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.service_discount || '0'),
      discountRemarks: item.service_discount_remarks
    },
    extraDetails: {
      id: 'extraDetails',
      name: 'Extra Details',
      rows: item.extra_services.flatMap((extraService, serviceIndex) =>
        extraService.params.map((param, paramIndex) => {
          // Calculate quantity based on group size and max_capacity
          const calculatedNo = calculateRowQuantity(param, item.package.total_space);
          // Calculate times based on package duration and per_day flag
          const calculatedTimes = param.per_day ? item.package.times : 1;
          // Calculate total based on flags
          const calculatedTotal = calculateRowTotal(param, calculatedNo, calculatedTimes);
          
          return {
            id: `extra-${serviceIndex}-${paramIndex}`,
            description: `${extraService.service_name} - ${param.name}`,
            rate: param.rate,
            no: calculatedNo,
            times: calculatedTimes,
            per_person: param.per_person,
            per_day: param.per_day,
            one_time: param.one_time,
            max_capacity: param.max_capacity,
            is_default: param.is_default,
            is_editable: param.is_editable,
            from_place: param.from_place,
            to_place: param.to_place,
            total: calculatedTotal
          };
        })
      ),
      discountType: item.extra_service_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.extra_service_discount || '0'),
      discountRemarks: item.extra_service_discount_remarks
    },
    accommodation: {
      id: 'accommodation',
      name: 'Accommodation',
      rows: item.accommodation?.map((acc, index) => {
        // Calculate quantity based on group size and max_capacity
        const calculatedNo = calculateRowQuantity(acc, item.package.total_space);
        // Calculate times based on package duration and per_day flag
        const calculatedTimes = acc.per_day ? item.package.times : 1;
        // Calculate total based on flags
        const calculatedTotal = calculateRowTotal(acc, calculatedNo, calculatedTimes);
        
        return {
          id: `accommodation-${index}`,
          description: acc.name,
          rate: acc.rate,
          no: calculatedNo,
          times: calculatedTimes,
          per_person: acc.per_person,
          per_day: acc.per_day,
          one_time: acc.one_time,
          max_capacity: acc.max_capacity,
          is_default: acc.is_default,
          is_editable: acc.is_editable,
          from_place: acc.from_place,
          to_place: acc.to_place,
          total: calculatedTotal
        };
      }) || [],
      discountType: item.accommodation_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.accommodation_discount || '0'),
      discountRemarks: item.accommodation_discount_remarks
    },
    transportation: {
      id: 'transportation',
      name: 'Transportation',
      rows: item.transportation?.map((trans, index) => {
        // Calculate quantity based on group size and max_capacity
        const calculatedNo = calculateRowQuantity(trans, item.package.total_space);
        // Calculate times based on package duration and per_day flag
        const calculatedTimes = trans.per_day ? item.package.times : 1;
        // Calculate total based on flags
        const calculatedTotal = calculateRowTotal(trans, calculatedNo, calculatedTimes);
        
        return {
          id: `transportation-${index}`,
          description: trans.name,
          rate: trans.rate,
          no: calculatedNo,
          times: calculatedTimes,
          per_person: trans.per_person,
          per_day: trans.per_day,
          one_time: trans.one_time,
          max_capacity: trans.max_capacity,
          is_default: trans.is_default,
          is_editable: trans.is_editable,
          from_place: trans.from_place,
          to_place: trans.to_place,
          total: calculatedTotal
        };
      }) || [],
      discountType: item.transportation_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.transportation_discount || '0'),
      discountRemarks: item.transportation_discount_remarks
    },
    customSections: [],
    serviceCharge: parseFloat(item.service_charge || '0') || 0,
    reportUrl: `/report/${item.id}`,
    clientCommunicationMethod: '',
    overallDiscountType: item.overall_discount_type === 'percentage' ? 'percentage' : 'amount',
    overallDiscountValue: parseFloat(item.overall_discount || '0'),
    overallDiscountRemarks: item.overall_discount_remarks,
    joined: 0,
    pending: item.package?.total_space || 0,
    paymentDetails: {
      totalCost: item.total_cost,
      totalPaid: item.total_paid || 0,
      balance: item.total_cost - (item.total_paid || 0),
      paymentStatus: (() => {
        const totalCost = item.total_cost;
        const totalPaid = item.total_paid || 0;
        const balance = totalCost - totalPaid;
        const epsilon = 0.01;

        if (totalPaid === 0) return 'unpaid';
        if (Math.abs(balance) <= epsilon || balance < 0) {
          return totalPaid > totalCost ? 'overpaid' : 'fully paid';
        }
        return 'partially paid';
      })()
    }
  };
}

// Fetch a single group and package from the real API
export async function fetchGroupAndPackageById(id: string): Promise<Report> {
  try {
    const item = await fetchFromAPI<APIGroupAndPackage>(`/staff/groups-and-package/${id}/`);
    return transformAPIGroupToReport(item);
  } catch (error) {
    console.error('Error fetching group and package by ID:', error);
    throw error;
  }
}

// Fetch extra invoices for a specific group from the real API
export async function fetchExtraInvoicesByGroupId(groupId: string): Promise<Report[]> {
  try {
    const data = await fetchFromAPI<APIGroupAndPackage[]>(`/staff/extra-invoice/${groupId}/`);
    return data.map(item => transformAPIGroupToReport(item, true, groupId));
  } catch (error) {
    console.error('Error fetching extra invoices:', error);
    throw error;
  }
}

// Fetch a single extra invoice by package ID from the parent group's extra invoices list
export async function fetchExtraInvoiceByInvoiceId(packageId: string, parentGroupId?: string): Promise<Report> {
  try {
    // Use the parent group ID to fetch the list of extra invoices
    const groupIdToFetch = parentGroupId || packageId;
    const data = await fetchFromAPI<APIGroupAndPackage[]>(`/staff/extra-invoice/${groupIdToFetch}/`);

    if (data && data.length > 0) {
      // Find the invoice with matching package ID
      const matchingInvoice = data.find(item => item.package?.id?.toString() === packageId);
      if (matchingInvoice) {
        return transformAPIGroupToReport(matchingInvoice, true, parentGroupId);
      }
      // If no match found but we have data, return the first one
      return transformAPIGroupToReport(data[0], true, parentGroupId);
    }

    throw new Error('No extra invoices found');
  } catch (error) {
    console.error('Error fetching extra invoice by package ID:', error);
    throw error;
  }
}

// Post groups and package data
export async function postGroupsAndPackage(data: any): Promise<any> {
  try {
    const token = getAccessToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/staff/groups-and-package/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Try to parse the error response for more details
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        console.log('API Error Response:', errorData);
        errorMessage = errorData.message || errorData.detail || JSON.stringify(errorData) || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
}

// Update groups and package data
export async function updateGroupsAndPackage(id: string, data: any): Promise<any> {
  try {
    const token = getAccessToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/staff/groups-and-package/${id}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Try to parse the error response for more details
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        console.log('API Error Response:', errorData);
        errorMessage = errorData.message || errorData.detail || JSON.stringify(errorData) || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
}

// Update an extra invoice using PUT method (uses package ID)
export async function updateExtraInvoice(packageId: string, data: any): Promise<any> {
  try {
    const token = getAccessToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/staff/extra-invoice-details/${packageId}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.detail || `Failed to update extra invoice (Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating extra invoice:', error);
    throw error;
  }
}

// Post extra invoice data (same payload structure as groups-and-package)
export async function postExtraInvoice(groupId: string, data: any): Promise<any> {
  try {
    const token = getAccessToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/staff/extra-invoice/${groupId}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Try to parse the error response for more details
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        console.log('API Error Response:', errorData);
        errorMessage = errorData.message || errorData.detail || JSON.stringify(errorData) || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw error;
  }
}



// Fetch transactions from the real API
export async function fetchTransactions(page: number = 1): Promise<APITransactionsResponse> {
  try {
    const data = await fetchFromAPI<APITransactionsResponse>(`/staff/payments/?page=${page}`);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function fetchTransactionsByGroupId(groupId: string): Promise<{ transactions: any[] }> {
  try {
    const data = await fetchFromAPI<APITransaction[]>(`/staff/transactions/${groupId}/`);

    // Transform the API response to match our Transaction type
    const transformedTransactions = data.map(transaction => ({
      id: transaction.id,
      groupId: transaction.groupId,
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date,
      note: transaction.note
    }));

    return { transactions: transformedTransactions };
  } catch (error) {
    throw error;
  }
}

// Add transaction to a specific group
export async function addTransaction(groupId: string, transactionData: any): Promise<any> {
  try {
    const token = getAccessToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/staff/transactions/${groupId}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}



// Fetch merged packages for a specific group from the real API
export async function fetchMergePackages(groupId: string): Promise<APIMergedPackage[]> {
  try {
    const data = await fetchFromAPI<APIMergePackagesResponse>(`/staff/merge_packages/${groupId}/`);
    return data.merged_packages || [];
  } catch (error) {
    console.error('Error fetching merge packages:', error);
    throw error;
  }
}

// Update merged packages for a specific group
export async function updateMergePackages(groupId: string, mergePackageIds: number[]): Promise<any> {
  try {
    const token = getAccessToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/staff/merge_packages/${groupId}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ merge_package_ids: mergePackageIds }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating merge packages:', error);
    throw error;
  }
}



// Make payment API request
export async function makePayment(paymentData: APIPaymentRequest): Promise<any> {
  try {
    const token = getAccessToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/staff/payments/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error making payment:', error);
    throw error;
  }
}



// Fetch payment details for a specific group from the real API
export async function fetchPaymentDetails(groupId: string): Promise<APIPaymentDetailResponse> {
  try {
    const data = await fetchFromAPI<APIPaymentDetailResponse>(`/staff/payment-detail/${groupId}/`);
    return data;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}



// Create traveler API request
export async function createTraveler(travelerData: APICreateTravelerRequest): Promise<any> {
  try {
    // Create FormData for multipart/form-data submission
    const formData = new FormData();

    // Add all fields to FormData
    Object.entries(travelerData).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, value);
      } else {
        formData.append(key, '');
      }
    });

    const token = getAccessToken();
    
    const headers: { [key: string]: string } = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BASE_URL}/staff/create-traveler/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating traveler:', error);
    throw error;
  }
}

// Fetch travelers for a specific package
export async function fetchTravelers(packageId: string): Promise<APITraveler[]> {
  try {
    const data = await fetchFromAPI<APITraveler[]>(`/staff/create-traveler/?package=${packageId}`);
    return data;
  } catch (error) {
    console.error('Error fetching travelers:', error);
    throw error;
  }
}

// Fetch all travelers from the real API
export async function fetchAllTravelers(): Promise<APITraveler[]> {
  try {
    const data = await fetchFromAPI<APITraveler[]>(`/staff/create-traveler/`);
    return data;
  } catch (error) {
    console.error('Error fetching all travelers:', error);
    throw error;
  }
}



// Fetch accommodation data for a specific trip
export async function getAccommodationList(tripId: string): Promise<any[]> {
  try {
    const data = await fetchFromAPI<any[]>(`/staff/accommodation-list/${tripId}/`);

    // Transform the API response to match our expected structure
    const transformedAccommodation = data.map(accommodation => ({
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
      to_place: '', // No to_place in the API response
    }));

    return transformedAccommodation;
  } catch (error) {
    console.error('Error fetching accommodation:', error);
    throw error;
  }
}

// Fetch dashboard stats from the real API
export async function fetchDashboardStats(): Promise<APIDashboardStats> {
  try {
    const data = await fetchFromAPI<APIDashboardStats>('/staff/stats/');
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// Authentication API functions

// Function to request OTP
export async function requestOtp(username: string, password: string): Promise<OtpRequestResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/otp/request/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Extract user-friendly error message from API response
    let errorMessage = `Failed to request OTP: ${response.status} ${response.statusText}`;
    
    if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
      errorMessage = errorData.non_field_errors[0] || errorMessage;
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// Function to verify OTP
export async function verifyOtp(userId: number, otp: string): Promise<OtpVerifyResponse> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/otp/verify/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, otp }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Extract user-friendly error message from API response
    let errorMessage = `Failed to verify OTP: ${response.status} ${response.statusText}`;
    
    if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
      errorMessage = errorData.non_field_errors[0] || errorMessage;
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.otp) {
      // Handle field-specific errors
      errorMessage = Array.isArray(errorData.otp) ? errorData.otp[0] : errorData.otp;
    } else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// Function to refresh access token
export async function refreshToken(): Promise<RefreshTokenResponse | null> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  if (!refreshToken) {
    // No refresh token available, clear any existing access token and return null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    return null;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    // If refresh token is invalid, clear all tokens
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
      }
    }
    const errorData = await response.json().catch(() => ({}));
    
    // Extract user-friendly error message from API response
    let errorMessage = `Failed to refresh token: ${response.status} ${response.statusText}`;
    
    if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
      errorMessage = errorData.non_field_errors[0] || errorMessage;
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.refresh) {
      // Handle refresh token specific errors
      errorMessage = Array.isArray(errorData.refresh) ? errorData.refresh[0] : errorData.refresh;
    } else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Update the access token in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.access);
  }
  return data;
}

// Store tokens in localStorage
export function storeAuthTokens(accessToken: string, refreshToken: string, userId: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_id', userId.toString());
  }
}
