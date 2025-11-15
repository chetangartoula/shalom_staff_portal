
import { initialTreks, services as staticServices } from '@/lib/mock-data';
import type { Trek, Service } from '@/lib/mock-data';

// In-memory data stores to simulate a database.
export let treks: Trek[] = [...initialTreks];
export let services: Service[] = [...staticServices];
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
