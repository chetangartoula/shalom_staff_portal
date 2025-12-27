
export interface Permit {
  name: string;
  rate: number;
  times: number;
}

export interface Trek {
  id: string;
  name: string;
  description: string;
  permits: Permit[];
}

export interface Service {
  id: string;
  name: string;
  rate: number;
  times: number;
  per_person?: boolean;
  per_day?: boolean;
  one_time?: boolean;
  is_default?: boolean;
  is_editable?: boolean;
  max_capacity?: number;
  from_place?: string;
  to_place?: string;
}

export interface CostRow {
  id: string;
  description: string;
  rate: number;
  no: number;
  times: number;
  total: number;
  // New permit-specific properties
  per_person?: boolean;
  per_day?: boolean;
  one_time?: boolean;
  is_default?: boolean;
  is_editable?: boolean;
  max_capacity?: number;
  from_place?: string;
  to_place?: string;
  location?: string;
}

export interface SectionState {
  id: string;
  name: string;
  rows: CostRow[];
  discountType: 'amount' | 'percentage';
  discountValue: number;
  discountRemarks?: string; // Added for individual discount remarks
}

export type GuideStatus = 'Available' | 'On Tour' | 'On Leave';

export interface Guide {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: GuideStatus;
}

export type PorterStatus = 'Available' | 'On Trek' | 'On Leave';

export interface Porter {
  id: string;
  name: string;
  phone: string;
  status: PorterStatus;
}

export type AirportPickUpStatus = 'Available' | 'On Duty' | 'On Leave';

export interface AirportPickUp {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: AirportPickUpStatus;
  vehicleType?: string;
  licensePlate?: string;
  driverName?: string;
  driverContact?: string;
}

export interface Assignment {
  groupId: string;
  guideIds: string[];
  porterIds: string[];
}

export interface Traveler {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  passportNumber?: string;
  emergencyContact: string;
  nationality?: string;
  profilePicture?: string;
  passportPhoto?: string;
  visaPhoto?: string;
  travelPolicyId?: string;
  travelInsurance?: string;
  // Properties added when joining with other data sources
  groupId?: string;
  trekName?: string;
  groupName?: string;
}

export type PaymentStatus = 'unpaid' | 'partially paid' | 'fully paid' | 'overpaid';

export interface Transaction {
  id: string;
  groupId: string;
  amount: number;
  type: 'payment' | 'refund';
  date: string;
  note?: string;
  paymentMethod?: string; // Added for payment method
  mergeGroups?: string[]; // Added for merged groups functionality
}

export interface PaymentDetails {
  totalCost: number;
  totalPaid: number;
  totalRefund?: number; // Added for refund tracking
  balance: number;
  paymentStatus: PaymentStatus;
}

export interface Report {
  groupId: string;
  trekId: string;
  trekName: string;
  groupName: string;
  groupSize: number;
  startDate: string;
  permits: SectionState;
  services: SectionState;
  accommodation: SectionState;
  transportation: SectionState;
  extraDetails: SectionState;
  customSections: SectionState[];
  serviceCharge: number;
  reportUrl: string;
  clientCommunicationMethod?: string; // Added for client communication method
  createdBy?: string; // Added for tracking who created the quotation

  // Overall discount fields
  overallDiscountType?: 'amount' | 'percentage';
  overallDiscountValue?: number;
  overallDiscountRemarks?: string;

  // From augmentation
  joined: number;
  pending: number;
  paymentDetails: PaymentDetails;
  isExtraInvoice?: boolean; // Flag to distinguish extra invoices from standard groups
  parentGroupId?: string; // Reference to the parent group ID for extra invoices
}


