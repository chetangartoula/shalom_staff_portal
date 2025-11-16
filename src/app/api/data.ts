
import { v4 as uuidv4 } from 'uuid';
import { initialTreks, services as staticServices } from '@/lib/mock-data';
import type { Trek, Service } from '@/lib/types';

// Add IDs to initial services
const initialServicesWithIds: Service[] = staticServices.map(s => ({ ...s, id: uuidv4() }));

// In-memory data stores to simulate a database.
export let treks: Trek[] = [...initialTreks];
export let services: Service[] = [...initialServicesWithIds];
export let reports: any[] = [];
export let travelers: any[] = [];

// Functions to manipulate the data
export const addTrek = (newTrek: Trek) => {
  treks.push(newTrek);
  return newTrek;
};

export const addReport = (newReport: any) => {
    reports.push(newReport);
    return newReport;
}

export const addTravelers = (newTravelers: any) => {
    travelers.push(newTravelers);
    return newTravelers;
}

// Service manipulation functions
export const addService = (serviceData: Omit<Service, 'id'>) => {
  const newService: Service = { ...serviceData, id: uuidv4() };
  services.push(newService);
  return newService;
};

export const updateService = (id: string, updatedData: Partial<Service>) => {
  const serviceIndex = services.findIndex(s => s.id === id);
  if (serviceIndex > -1) {
    services[serviceIndex] = { ...services[serviceIndex], ...updatedData };
    return services[serviceIndex];
  }
  return null;
};

export const deleteService = (id: string) => {
  const serviceIndex = services.findIndex(s => s.id === serviceIndex, 1);
  if (serviceIndex > -1) {
    const deleted = services.splice(serviceIndex, 1);
    return deleted[0];
  }
  return null;
};
