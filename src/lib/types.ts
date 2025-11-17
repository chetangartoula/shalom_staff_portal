
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
