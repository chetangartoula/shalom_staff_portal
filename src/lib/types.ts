
export interface Permit {
  name: string;
  rate: number;
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
}

export interface CostRow {
  id: string;
  description: string;
  rate: number;
  no: number;
  times: number;
  total: number;
}

export interface SectionState {
    id: string;
    name: string;
    rows: CostRow[];
    discountType: 'amount' | 'percentage';
    discountValue: number;
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

export interface Assignment {
  groupId: string;
  guideIds: string[];
  porterIds: string[];
}

export interface Traveler {
  id: string;
  name: string;
  phone: string;
  address: string;
  passportNumber?: string;
  emergencyContact: string;
  dateOfBirth?: string;
  nationality?: string;
  passportExpiryDate?: string;
  profilePicture?: string;
  passportPhoto?: string;
  visaPhoto?: string;
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
}

export interface PaymentDetails {
  totalCost: number;
  totalPaid: number;
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
  extraDetails: SectionState;
  customSections: SectionState[];
  serviceCharge: number;
  reportUrl: string;
  
  // From augmentation
  joined: number;
  pending: number;
  paymentDetails: PaymentDetails;
}

    
