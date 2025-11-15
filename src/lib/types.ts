
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
    discount: number;
}
