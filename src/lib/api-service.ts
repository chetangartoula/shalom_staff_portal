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
      // Handle specific HTTP status codes
      if (response.status === 404) {
        throw new Error(`404: Resource not found at ${endpoint}`);
      } else if (response.status === 401) {
        throw new Error(`401: Unauthorized access to ${endpoint}`);
      } else if (response.status === 500) {
        throw new Error(`500: Internal server error at ${endpoint}`);
      } else {
        throw new Error(`API request failed with status ${response.status} for ${endpoint}`);
      }
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

// Define interfaces for guides and porters API responses
interface APIGuide {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
}

interface APIPorter {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
}

// Define interfaces for assignments API responses
interface APIAssignmentGuide {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
}

interface APIAssignmentPorter {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
}

interface APIAssignment {
  groupId: number;
  trekName: string;
  groupName: string;
  startDate: string;
  guides: APIAssignmentGuide[];
  porters: APIAssignmentPorter[];
  airportPickUp: any[]; // We'll define this properly if needed
}

interface APIAssignTeamResponse {
  id: number;
  guides: number[];
  porters: number[];
  package: number;
}

// Define interfaces for airport pickup API responses
interface APIAirportPickUp {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  vehicle_type?: string;
  license_plate?: string;
  driver_name?: string;
  driver_contact?: string;
}

// Define interface for the new API response structure
interface APIGroupAndPackage {  id: number;
  package: {
    id: number;
    created_at: string;
    updated_at: string;
    slug: string;
    name: string;
    total_space: number;
    start_date: string;
    end_date: string;
    trip: number;
  };
  status: string;
  permits: Array<{
    name: string;
    rate: number;
    times: number;
    numbers: number;
  }>;
  services: Array<{
    name: string;
    rate: number;
    times: number;
    numbers: number;
  }>;
  extra_services: Array<{
    service_name: string;
    params: Array<{
      name: string;
      rate: number;
      times: number;
      numbers: number;
    }>;
  }>;
  service_discount: string;
  service_discount_type: string;
  service_discount_remarks: string;
  extra_service_discount: string;
  extra_service_discount_type: string;
  extra_service_discount_remarks: string;
  permit_discount: string;
  permit_discount_type: string;
  permit_discount_remarks: string;
  overall_discount: string;
  overall_discount_type: string;
  overall_discount_remarks: string;
  sub_total: string;
  total_cost: string;
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
export async function fetchAssignments(): Promise<{ assignments: any[] }> {  try {
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
        name: 'Permits & Food',
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
            description: param.name,
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
      customSections: [],
      serviceCharge: 0, // This might need to be calculated or fetched separately
      reportUrl: `/report/${item.id}`, // Removed window.location.origin
      clientCommunicationMethod: '',
      overallDiscountType: item.overall_discount_type === 'percentage' ? 'percentage' : 'amount',
      overallDiscountValue: parseFloat(item.overall_discount),
      overallDiscountRemarks: item.overall_discount_remarks,
      createdBy: 'API User', // This would need to be fetched from the API or set differently
      joined: 0, // This would need to be fetched from the API or calculated
      pending: item.package.total_space, // This would need to be fetched from the API or calculated
      paymentDetails: {
        totalCost: parseFloat(item.total_cost),
        totalPaid: 0, // This would need to be fetched from the API or calculated
        balance: parseFloat(item.total_cost), // This would need to be fetched from the API or calculated
        paymentStatus: 'unpaid' as const // This would need to be fetched from the API or calculated
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
export async function fetchGroupAndPackageById(id: string): Promise<any> {
  try {
    const item = await fetchFromAPI<APIGroupAndPackage>(`/staff/groups-and-package/${id}/`);
    
    // Transform the API response to match our Report type
    const transformedReport = {
      groupId: item.id.toString(),
      trekId: item.package.trip.toString(),
      trekName: item.package.name, // We might need to fetch the actual trek name separately
      groupName: item.package.name,
      groupSize: item.package.total_space,
      startDate: item.package.start_date,
      permits: {
        id: 'permits',
        name: 'Permits & Food',
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
            description: param.name,
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
      customSections: [],
      serviceCharge: 0, // This might need to be calculated or fetched separately
      reportUrl: `/report/${item.id}`, // Relative path, will be made absolute in the API route
      clientCommunicationMethod: '',
      overallDiscountType: item.overall_discount_type === 'percentage' ? 'percentage' : 'amount',
      overallDiscountValue: parseFloat(item.overall_discount),
      overallDiscountRemarks: item.overall_discount_remarks,
      createdBy: 'API User', // This would need to be fetched from the API or set differently
      joined: 0, // This would need to be fetched from the API or calculated
      pending: item.package.total_space, // This would need to be fetched from the API or calculated
      paymentDetails: {
        totalCost: parseFloat(item.total_cost),
        totalPaid: 0, // This would need to be fetched from the API or calculated
        balance: parseFloat(item.total_cost), // This would need to be fetched from the API or calculated
        paymentStatus: 'unpaid' as const // This would need to be fetched from the API or calculated
      }
    };

    return transformedReport;
  } catch (error) {
    console.error('Error fetching group and package by ID:', error);
    throw error;
  }
}

// Post groups and package data
export async function postGroupsAndPackage(data: any): Promise<any> {
  try {
    // Log the payload for debugging
    console.log('Sending payload to API:', JSON.stringify(data, null, 2));
    
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
    console.error('Error posting groups and package:', error);
    throw error;
  }
}

// Define interface for transactions API response
interface APITransactionResult {
  id: number;
  package_id: number;
  package_name: string;
  amount: number;
  payment_method: string;
  payment_types: string | null;
  remarks: string;
  date: string;
}

interface APITransactionsResults {
  total_payments: number;
  total_pay: number;
  total_refund: number;
  balance: number;
  transactions: APITransactionResult[];
}

interface APITransactionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: APITransactionsResults;
}

// Fetch transactions from the real API
export async function fetchTransactions(page: number = 1): Promise<APITransactionsResponse> {
  try {
    const data = await fetchFromAPI<APITransactionsResponse>(`/staff/payments/?page=${page}`);
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

// Define interface for transaction API response
interface APITransaction {
  id: string;
  groupId: string;
  amount: number;
  type: 'payment' | 'refund';
  date: string;
  note: string;
}

// Define interface for all transactions API response
interface APIAllTransactionsResponse {
  transactions: APITransaction[];
  total?: number;
  hasMore?: boolean;
  summary?: {
    totalPayments: number;
    totalRefunds: number;
    netTotal: number;
  };
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
    console.error('Error fetching all transactions:', error);
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
    console.error('Error fetching transactions:', error);
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
    console.error('Error adding transaction:', error);
    throw error;
  }
}

// Define interface for merge packages API response
interface APIMergedPackage {
  id: number;
  name: string;
}

interface APIMergePackagesResponse {
  merged_packages: APIMergedPackage[];
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

// Define interface for payment API request
export interface APIPaymentRequest {
  package_id: string;
  amount: number;
  remarks: string;
  payment_type: 'pay' | 'refund';
  date: string;
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

// Define interface for payment detail API response
interface APIPayment {
  id: number;
  amount: number;
  payment_method: string;
  payment_types: string;
  remarks: string;
  date: string;
}

interface APIPaymentDetailResponse {
  total_amount: number;
  payments: APIPayment[];
  total_paid: number;
  total_refund: number;
  balance: number;
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

// Define interface for traveler creation API request
interface APICreateTravelerRequest {
  profile_pic: string | null;
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  passport_number: string;
  nationality: string;
  passport_photo: string | null;
  visa_photo: string | null;
  traval_policy_document: string | null;
  traval_insurance_document: string | null;
  package: number | null;
}

// Define interface for traveler response
interface APITraveler {
  id: number;
  created_at: string;
  updated_at: string;
  slug: string;
  profile_pic: string | null;
  full_name: string;
  phone_number: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  passport_number: string;
  nationality: string;
  passport_photo: string | null;
  visa_photo: string | null;
  traval_policy_document: string | null;
  traval_insurance_document: string | null;
  package: number;
  package_name: string;
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
