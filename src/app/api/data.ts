
import type { Trek, Service, Guide, Porter } from '@/lib/types';
import { initialTreks, services as staticServices, initialGuides, initialPorters } from '@/lib/mock-data';

// Add IDs to initial data
const initialServicesWithIds: Service[] = staticServices.map(s => ({ ...s, id: crypto.randomUUID() }));
const initialGuidesWithIds: Guide[] = initialGuides.map(g => ({ ...g, id: crypto.randomUUID() }));
const initialPortersWithIds: Porter[] = initialPorters.map(p => ({ ...p, id: crypto.randomUUID() }));


// In-memory data stores to simulate a database.
export let treks: Trek[] = [...initialTreks];
export let services: Service[] = [...initialServicesWithIds];
export let guides: Guide[] = [...initialGuidesWithIds];
export let porters: Porter[] = [...initialPortersWithIds];
export let reports: any[] = [];
export let travelers: any[] = [];

// Functions to manipulate the data

// Treks
export const getTreks = () => {
    return { treks };
}
export const addTrek = (newTrek: Omit<Trek, 'id'>) => {
  const trekWithId = { ...newTrek, id: crypto.randomUUID() };
  treks.push(trekWithId);
  return trekWithId;
};

// Services
export const getPaginatedServices = (page: number, limit: number) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedServices = services.slice(startIndex, endIndex);
  
  return { 
    services: paginatedServices,
    total: services.length,
    hasMore: endIndex < services.length,
  };
}
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

// Guides
export const getGuides = () => {
  return { guides };
}

// Porters
export const getPorters = () => {
    return { porters };
}


// Reports
export const getPaginatedReports = (page: number, limit: number) => {
  const reversedReports = [...reports].reverse();
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedReports = reversedReports.slice(startIndex, endIndex);

  const augmentedReports = paginatedReports.map(report => {
    const travelerGroup = travelers.find(t => t.groupId === report.groupId);
    const joinedTravelers = travelerGroup ? travelerGroup.travelers.length : 0;
    const pendingTravelers = report.groupSize - joinedTravelers;
    return {
      ...report,
      joined: joinedTravelers,
      pending: pendingTravelers,
    };
  });

  return { 
    reports: augmentedReports,
    total: reports.length,
    hasMore: endIndex < reports.length,
  };
}
export const getReportByGroupId = (groupId: string) => {
    const report = reports.find(r => r.groupId === groupId);
    return report || null;
}
export const addReport = (report: any) => {
    reports.push(report);
    return report;
}
export const updateReport = (groupId: string, body: any) => {
    const reportIndex = reports.findIndex(r => r.groupId === groupId);
    if (reportIndex > -1) {
        reports[reportIndex] = { ...reports[reportIndex], ...body };
        return reports[reportIndex];
    }
    return null;
}

// Travelers
export async function getAllTravelers() {
  const reportMap = new Map(reports.map(r => [r.groupId, r]));
  const allTravelers = travelers.flatMap(group => {
    const report = reportMap.get(group.groupId);
    return group.travelers.map((traveler: any) => ({
      ...traveler,
      groupId: group.groupId,
      trekName: report ? report.trekName : 'N/A',
    }));
  });
  return { travelers: allTravelers };
}
export const getTravelerGroup = (groupId: string) => {
    return travelers.find(t => t.groupId === groupId);
}
export const updateTravelerGroup = (groupId: string, submittedTraveler: any) => {
    const groupIndex = travelers.findIndex(t => t.groupId === groupId);
    if (groupIndex > -1) {
        const existingGroup = travelers[groupIndex];
        const travelerIndex = existingGroup.travelers.findIndex((t: any) => t.id === submittedTraveler.id);

        if (travelerIndex > -1) {
            existingGroup.travelers[travelerIndex] = { ...existingGroup.travelers[travelerIndex], ...submittedTraveler };
        } else {
            existingGroup.travelers.push(submittedTraveler);
        }
        travelers[groupIndex] = existingGroup;
        return travelers[groupIndex];
    } else {
        const newTravelerGroup = { groupId, travelers: [submittedTraveler] };
        travelers.push(newTravelerGroup);
        return newTravelerGroup;
    }
}

// Stats
export const getStats = () => {
    return {
        reports: reports.length,
        travelers: travelers.reduce((acc, group) => acc + group.travelers.length, 0),
        treks: treks.length,
        services: services.length,
        guides: guides.length,
        porters: porters.length,
    };
}
