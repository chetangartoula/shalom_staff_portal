
import type { Trek, Service } from '@/lib/types';
import { initialTreks, services as staticServices } from '@/lib/mock-data';

// Add IDs to initial services
const initialServicesWithIds: Service[] = staticServices.map(s => ({ ...s, id: crypto.randomUUID() }));

// In-memory data stores to simulate a database.
export let treks: Trek[] = [...initialTreks];
export let services: Service[] = [...initialServicesWithIds];
export let reports: any[] = [];
export let travelers: any[] = [];

// Functions to manipulate the data
export const addTrek = async (newTrek: Omit<Trek, 'id'>) => {
  const trekWithId = { ...newTrek, id: crypto.randomUUID() };
  treks.push(trekWithId);
  return trekWithId;
};

// Service manipulation functions
export const addService = (serviceData: Omit<Service, 'id'>) => {
  const newService: Service = { ...serviceData, id: crypto.randomUUID() };
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
  const serviceIndex = services.findIndex(s => s.id === id);
  if (serviceIndex > -1) {
    const deleted = services.splice(serviceIndex, 1);
    return deleted[0];
  }
  return null;
};
