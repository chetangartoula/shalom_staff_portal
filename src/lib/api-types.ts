/**
 * API Type Definitions
 * 
 * This file contains all the interface definitions for API responses and requests.
 * These types represent the structure of data received from or sent to the backend API.
 */

// ============================================================================
// Trip & Trek Related Types
// ============================================================================

export interface APITrip {
    id: number;
    title: string;
    combined_info: string;
    times: number;
}

// ============================================================================
// Permit Related Types
// ============================================================================

export interface APIPermit {
    id: number;
    name: string;
    rate: string; // API returns rate as string
    times: number;
    per_person: boolean;
    per_day: boolean;
    one_time: boolean;
    is_default: boolean;
    is_compulsory?: boolean;
    is_editable: boolean;
    max_capacity: number;
    from_place: string;
    to_place: string;
    is_active: boolean;
    order: number;
}

// ============================================================================
// Service Related Types
// ============================================================================

export interface APIService {
    id: number;
    name: string;
    rate: string; // API returns rate as string
    times: number;
    max_num: number;
    per_person?: boolean;
    per_day?: boolean;
    one_time?: boolean;
    is_default?: boolean;
    is_compulsory?: boolean;
    is_editable?: boolean;
    from_place?: string;
    to_place?: string;
}

export interface APIExtraServiceParam {
    name: string;
    rate: number;
    per_person?: boolean;
    per_day?: boolean;
    one_time?: boolean;
    is_default?: boolean;
    is_compulsory?: boolean;
    is_editable?: boolean;
    max_capacity?: number;
    from_place?: string;
    to_place?: string;
}

export interface APIExtraService {
    id: number;
    service_name: string;
    params: APIExtraServiceParam[];
    times: number;
    per_person?: boolean;
    per_day?: boolean;
    one_time?: boolean;
    is_default?: boolean;
    is_compulsory?: boolean;
    is_editable?: boolean;
    max_num?: number;
    from_place?: string;
    to_place?: string;
}

// ============================================================================
// Team Member Related Types (Guides, Porters, Airport Pickup)
// ============================================================================

export interface APIGuide {
    id: number;
    name: string;
    phone: string;
    email: string;
    status: string;
}

export interface APIPorter {
    id: number;
    name: string;
    phone: string;
    email: string;
    status: string;
}

export interface APIAirportPickUp {
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

// ============================================================================
// Assignment Related Types
// ============================================================================

export interface APIAssignmentGuide {
    id: number;
    name: string;
    phone: string;
    email: string;
    status: string;
}

export interface APIAssignmentPorter {
    id: number;
    name: string;
    phone: string;
    email: string;
    status: string;
}

export interface APIAssignment {
    groupId: number;
    trekName: string;
    groupName: string;
    startDate: string;
    guides: APIAssignmentGuide[];
    porters: APIAssignmentPorter[];
    airportPickUp: any[]; // We'll define this properly if needed
}

export interface APIAssignTeamResponse {
    id: number;
    guides: number[];
    porters: number[];
    package: number;
}

// ============================================================================
// Group & Package Related Types
// ============================================================================

export interface APIGroupAndPackage {
    total_paid: number;
    id: number;
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
    accommodation: Array<{
        name: string;
        rate: number;
        times: number;
        numbers: number;
    }>;
    transportation: Array<{
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
    accommodation_discount: string;
    accommodation_discount_type: string;
    accommodation_discount_remarks: string;
    transportation_discount: string;
    transportation_discount_type: string;
    transportation_discount_remarks: string;
    overall_discount: string;
    overall_discount_type: string;
    overall_discount_remarks: string;
    sub_total: number;
    total_cost: number;
    service_charge: string;
}

// ============================================================================
// Transaction Related Types
// ============================================================================

export interface APITransactionResult {
    id: number;
    package_id: number;
    package_name: string;
    amount: number;
    payment_method: string;
    payment_types: string | null;
    remarks: string;
    date: string;
}

export interface APITransactionsResults {
    total_payments: number;
    total_pay: number;
    total_refund: number;
    balance: number;
    transactions: APITransactionResult[];
}

export interface APITransactionsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: APITransactionsResults;
}

export interface APITransaction {
    id: string;
    groupId: string;
    amount: number;
    type: 'payment' | 'refund';
    date: string;
    note: string;
}

export interface APIAllTransactionsResponse {
    transactions: APITransaction[];
    total?: number;
    hasMore?: boolean;
    summary?: {
        totalPayments: number;
        totalRefunds: number;
        netTotal: number;
    };
}

// ============================================================================
// Merge Packages Related Types
// ============================================================================

export interface APIMergedPackage {
    id: number;
    name: string;
}

export interface APIMergePackagesResponse {
    merged_packages: APIMergedPackage[];
}

// ============================================================================
// Payment Related Types
// ============================================================================


export interface APIPaymentRequest {
    package_id: string;
    amount: number;
    remarks: string;
    payment_type: 'pay' | 'refund';
    payment_method: string;
    date: string;
}

export interface APIPayment {
    id: number;
    amount: number;
    payment_method: string;
    payment_types: string | null;
    remarks: string;
    date: string;
}

export interface APIPaymentDetailResponse {
    package_id: number;
    package_name: string;
    total_cost: number;
    total_paid: number;
    total_refund: number;
    balance: number;
    payments: APIPayment[];
}

// ============================================================================
// Traveler Related Types
// ============================================================================

export interface APICreateTravelerRequest {
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

export interface APITraveler {
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

// ============================================================================
// Dashboard Stats Related Types
// ============================================================================

export interface APIDashboardStats {
    stats: {
        reports: number;
        travelers: number;
        treks: number;
        guides: number;
        porters: number;
    };
    recentReports: {
        reports: Array<{
            groupId: string;
            trekName: string;
            groupName: string;
            groupSize: number;
            startDate: string;
        }>;
        total: number;
    };
    trekPopularity: {
        chartData: Array<{
            name: string;
            value: number;
        }>;
    };
    teamAvailability: {
        chartData: Array<{
            name: string;
            value: number;
        }>;
    };
    paymentAnalytics: {
        chartData: Array<{
            date: string;
            payments: number;
            refunds: number;
        }>;
    };
}
