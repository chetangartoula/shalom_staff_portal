import type { Trek, Report, SectionState } from '@/lib/types';
import type {
  APITrip,
  APIPermit,
  APIService,
  APIExtraServiceParam,
  APIExtraService,
  APIGuide,
  APIPorter,
  APIAssignmentGuide,
  APIAssignmentPorter,
  APIAssignment,
  APIAssignTeamResponse,
  APIAirportPickUp,
  APIGroupAndPackage,
  APITransactionResult,
  APITransactionsResults,
  APITransactionsResponse,
  APITransaction,
  APIAllTransactionsResponse,
  APIMergedPackage,
  APIMergePackagesResponse,
  APIPayment,
  APIPaymentRequest,
  APIPaymentDetailResponse,
  APICreateTravelerRequest,
  APITraveler,
  APIDashboardStats
} from '@/lib/api-types';

// Base URL for the external API - use environment variable with fallback
const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1`;

// Generic fetch function with error handling
export async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();
  const TIMEOUT_MS = 30000; // 30 seconds timeout
  
  // Set a timeout to abort the request if it takes too long
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // credentials: 'include',
    });

    // Clear the timeout as we got a response
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status} for ${endpoint}`;
      
      // Try to get more detailed error message from response
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = `${response.status}: ${errorData.message}`;
        }
      } catch (e) {
        // If we can't parse the error response, use the status code
        switch (response.status) {
          case 400:
            errorMessage = `400: Bad request - The request was invalid or cannot be served`;
            break;
          case 401:
            errorMessage = `401: Unauthorized - Authentication is required and has failed or has not been provided`;
            break;
          case 403:
            errorMessage = `403: Forbidden - The server understood the request but refuses to authorize it`;
            break;
          case 404:
            errorMessage = `404: Not Found - The requested resource was not found at ${endpoint}`;
            break;
          case 408:
            errorMessage = `408: Request Timeout - The server timed out waiting for the request`;
            break;
          case 500:
            errorMessage = `500: Internal Server Error - The server encountered an unexpected condition`;
            break;
          case 502:
            errorMessage = `502: Bad Gateway - The server received an invalid response from the upstream server`;
            break;
          case 503:
            errorMessage = `503: Service Unavailable - The server is currently unavailable`;
            break;
          case 504:
            errorMessage = `504: Gateway Timeout - The server did not receive a timely response from the upstream server`;
            break;
        }
      }
      
      // Log the error for debugging
      console.error(`API Error (${response.status}): ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Parse and return the response data
    try {
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Failed to parse JSON response from ${endpoint}`);
    }
  } catch (error) {
    // Clean up the timeout if the request completes with an error
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout - The server took too long to respond (${TIMEOUT_MS/1000} seconds)`);
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error - Unable to connect to the server. Please check your internet connection.');
      }
    }
    
    // Re-throw the original error if we don't have a specific handler for it
    throw error;
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

    const response = await fetch(`${BASE_URL}/staff/assign-teams/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

// Fetch groups and packages from the real API
export async function fetchGroupsAndPackages(page: number = 1, limit: number = 10): Promise<{
  reports: any[];
  total: number;
  hasMore: boolean
}> {
  try {
    const data = await fetchFromAPI<APIGroupAndPackage[]>(`/staff/groups-and-package/?page=${page}&limit=${limit}`);

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
        rows: item.permits.map((permit, index) => ({
          id: `permit-${index}`,
          description: permit.name,
          rate: permit.rate,
          no: permit.numbers,
          times: permit.times,
          total: permit.rate * permit.numbers * permit.times
        })),
        discountType: item.permit_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.permit_discount),
        discountRemarks: item.permit_discount_remarks
      },
      services: {
        id: 'services',
        name: 'Services',
        rows: item.services.map((service, index) => ({
          id: `service-${index}`,
          description: service.name,
          rate: service.rate,
          no: service.numbers,
          times: service.times,
          total: service.rate * service.numbers * service.times
        })),
        discountType: item.service_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.service_discount),
        discountRemarks: item.service_discount_remarks
      },
      extraDetails: {
        id: 'extraDetails',
        name: 'Extra Details',
        rows: item.extra_services.flatMap((extraService, serviceIndex) =>
          extraService.params.map((param, paramIndex) => ({
            id: `extra-${serviceIndex}-${paramIndex}`,
            description: `${extraService.service_name} - ${param.name}`,
            rate: param.rate,
            no: param.numbers,
            times: param.times,
            total: param.rate * param.numbers * param.times
          }))
        ),
        discountType: item.extra_service_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.extra_service_discount),
        discountRemarks: item.extra_service_discount_remarks
      },
      accommodation: {
        id: 'accommodation',
        name: 'Accommodation',
        rows: item.accommodation?.map((acc, index) => ({
          id: `accommodation-${index}`,
          description: acc.name,
          rate: acc.rate,
          no: acc.numbers,
          times: acc.times,
          total: acc.rate * acc.numbers * acc.times
        })) || [],
        discountType: item.accommodation_discount_type === 'percentage' ? 'percentage' : 'amount',
        discountValue: parseFloat(item.accommodation_discount || '0'),
        discountRemarks: item.accommodation_discount_remarks
      },
      transportation: {
        id: 'transportation',
        name: 'Transportation',
        rows: item.transportation?.map((trans, index) => ({
          id: `transportation-${index}`,
          description: trans.name,
          rate: trans.rate,
          no: trans.numbers,
          times: trans.times,
          total: trans.rate * trans.numbers * trans.times
        })) || [],
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
      hasMore: data.length === limit // This should be determined by the API
    };
  } catch (error) {
    console.error('Error fetching groups and packages:', error);
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
      rows: item.permits.map((permit, index) => ({
        id: `permit-${index}`,
        description: permit.name,
        rate: permit.rate,
        no: permit.numbers,
        times: permit.times,
        total: permit.rate * permit.numbers * permit.times
      })),
      discountType: item.permit_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.permit_discount || '0'),
      discountRemarks: item.permit_discount_remarks
    },
    services: {
      id: 'services',
      name: 'Services',
      rows: item.services.map((service, index) => ({
        id: `service-${index}`,
        description: service.name,
        rate: service.rate,
        no: service.numbers,
        times: service.times,
        total: service.rate * service.numbers * service.times
      })),
      discountType: item.service_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.service_discount || '0'),
      discountRemarks: item.service_discount_remarks
    },
    extraDetails: {
      id: 'extraDetails',
      name: 'Extra Details',
      rows: item.extra_services.flatMap((extraService, serviceIndex) =>
        extraService.params.map((param, paramIndex) => ({
          id: `extra-${serviceIndex}-${paramIndex}`,
          description: `${extraService.service_name} - ${param.name}`,
          rate: param.rate,
          no: param.numbers,
          times: param.times,
          total: param.rate * param.numbers * param.times
        }))
      ),
      discountType: item.extra_service_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.extra_service_discount || '0'),
      discountRemarks: item.extra_service_discount_remarks
    },
    accommodation: {
      id: 'accommodation',
      name: 'Accommodation',
      rows: item.accommodation?.map((acc, index) => ({
        id: `accommodation-${index}`,
        description: acc.name,
        rate: acc.rate,
        no: acc.numbers,
        times: acc.times,
        total: acc.rate * acc.numbers * acc.times
      })) || [],
      discountType: item.accommodation_discount_type === 'percentage' ? 'percentage' : 'amount',
      discountValue: parseFloat(item.accommodation_discount || '0'),
      discountRemarks: item.accommodation_discount_remarks
    },
    transportation: {
      id: 'transportation',
      name: 'Transportation',
      rows: item.transportation?.map((trans, index) => ({
        id: `transportation-${index}`,
        description: trans.name,
        rate: trans.rate,
        no: trans.numbers,
        times: trans.times,
        total: trans.rate * trans.numbers * trans.times
      })) || [],
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
    const response = await fetch(`${BASE_URL}/staff/groups-and-package/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${BASE_URL}/staff/groups-and-package/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${BASE_URL}/staff/extra-invoice-details/${packageId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${BASE_URL}/staff/extra-invoice/${groupId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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



// Fetch all transactions from the real API
export async function fetchAllTransactions(): Promise<{ transactions: any[] }> {
  try {
    const data = await fetchFromAPI<APIAllTransactionsResponse>(`/staff/transactions/all/`);

    // Transform the API response to match our Transaction type
    const transformedTransactions = data.transactions.map(transaction => ({
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

// Fetch transactions for a specific group from the real API
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
    const response = await fetch(`${BASE_URL}/staff/transactions/${groupId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${BASE_URL}/staff/merge_packages/${groupId}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${BASE_URL}/staff/payments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    const response = await fetch(`${BASE_URL}/staff/create-traveler/`, {
      method: 'POST',
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
