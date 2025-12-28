"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrekCostingPage } from "@/components/dashboard/trek-costing-page";
import type { Trek } from "@/lib/types";
import { useTrips } from '@/hooks/use-trips';
import { usePermits } from '@/hooks/use-permits';
import { useAllPermits } from '@/hooks/use-all-permits';
import { useServices } from '@/hooks/use-services';
import { useExtraServices } from '@/hooks/use-extra-services';
import { useAllServices } from '@/hooks/use-all-services';
import { useAllExtraServices } from '@/hooks/use-all-extra-services';
import { useAccommodation } from '@/hooks/use-accommodation';
import { useTransportation } from '@/hooks/use-transportation';
import { useAllAccommodations } from '@/hooks/use-all-accommodations';
import { useAllTransportations } from '@/hooks/use-all-transportations';
import { Loader2 } from 'lucide-react';
import { getUserClient } from '@/lib/auth-client';

interface User {
  name: string;
  email: string;
  role: string;
}

interface ClientCostEstimatorProps {
  initialTreks: Trek[];
  user: User | null;
}

export function ClientCostEstimatorWithData({ initialTreks, user: initialUser }: ClientCostEstimatorProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [selectedTrekId, setSelectedTrekId] = useState<string | null>(null);
  const [permitsOverride, setPermitsOverride] = useState<any>(null);
  const [servicesOverride, setServicesOverride] = useState<any>(null);
  const [extraServicesOverride, setExtraServicesOverride] = useState<any>(null);
  const [accommodationOverride, setAccommodationOverride] = useState<any>(null);
  const [transportationOverride, setTransportationOverride] = useState<any>(null);
  
  // Function to calculate permit total based on the new permit properties
  const calculatePermitTotal = (permit: any, no: number, times: number) => {
    // Apply calculation based on boolean flags
    if (permit.one_time) {
      // If one_time is true, calculate as rate (single occurrence regardless of other factors)
      return permit.rate;
    } else if (permit.per_person && permit.per_day) {
      // If both per_person and per_day are true, calculate as rate * no * times
      return permit.rate * no * times;
    } else if (permit.per_person) {
      // If per_person is true, calculate as rate * no
      return permit.rate * no;
    } else if (permit.per_day) {
      // If per_day is true, calculate as rate * times
      return permit.rate * times;
    } else {
      // If none of the above flags are true, calculate as rate * no * times (default)
      return permit.rate * no * times;
    }
  };
  
  // Function to calculate service total based on the new service properties
  const calculateServiceTotal = (service: any, no: number, times: number) => {
    // Apply calculation based on boolean flags
    if (service.one_time) {
      // If one_time is true, calculate as rate (single occurrence regardless of other factors)
      return service.rate;
    } else if (service.per_person && service.per_day) {
      // If both per_person and per_day are true, calculate as rate * no * times
      return service.rate * no * times;
    } else if (service.per_person) {
      // If per_person is true, calculate as rate * no
      return service.rate * no;
    } else if (service.per_day) {
      // If per_day is true, calculate as rate * times
      return service.rate * times;
    } else {
      // If none of the above flags are true, calculate as rate * no * times (default)
      return service.rate * no * times;
    }
  };
  
  // Function to calculate extra service total based on the new extra service properties
  const calculateExtraServiceTotal = (extraService: any, no: number, times: number) => {
    // Apply calculation based on boolean flags
    if (extraService.one_time) {
      // If one_time is true, calculate as rate (single occurrence regardless of other factors)
      return extraService.rate;
    } else if (extraService.per_person && extraService.per_day) {
      // If both per_person and per_day are true, calculate as rate * no * times
      return extraService.rate * no * times;
    } else if (extraService.per_person) {
      // If per_person is true, calculate as rate * no
      return extraService.rate * no;
    } else if (extraService.per_day) {
      // If per_day is true, calculate as rate * times
      return extraService.rate * times;
    } else {
      // If none of the above flags are true, calculate as rate * no * times (default)
      return extraService.rate * no * times;
    }
  };
  
  // Function to calculate accommodation total based on the new accommodation properties
  const calculateAccommodationTotal = (accommodation: any, no: number, times: number) => {
    // Apply calculation based on boolean flags
    if (accommodation.one_time) {
      // If one_time is true, calculate as rate (single occurrence regardless of other factors)
      return accommodation.rate;
    } else if (accommodation.per_person && accommodation.per_day) {
      // If both per_person and per_day are true, calculate as rate * no * times
      return accommodation.rate * no * times;
    } else if (accommodation.per_person) {
      // If per_person is true, calculate as rate * no
      return accommodation.rate * no;
    } else if (accommodation.per_day) {
      // If per_day is true, calculate as rate * times
      return accommodation.rate * times;
    } else {
      // If none of the above flags are true, calculate as rate * no * times (default)
      return accommodation.rate * no * times;
    }
  };
  
  // Function to calculate transportation total based on the new transportation properties
  const calculateTransportationTotal = (transportation: any, no: number, times: number) => {
    // Apply calculation based on boolean flags
    if (transportation.one_time) {
      // If one_time is true, calculate as rate (single occurrence regardless of other factors)
      return transportation.rate;
    } else if (transportation.per_person && transportation.per_day) {
      // If both per_person and per_day are true, calculate as rate * no * times
      return transportation.rate * no * times;
    } else if (transportation.per_person) {
      // If per_person is true, calculate as rate * no
      return transportation.rate * no;
    } else if (transportation.per_day) {
      // If per_day is true, calculate as rate * times
      return transportation.rate * times;
    } else {
      // If none of the above flags are true, calculate as rate * no * times (default)
      return transportation.rate * no * times;
    }
  };
  
  // Handle trek selection
  const handleTrekSelect = useCallback((trekId: string) => {
    setSelectedTrekId(trekId);
  }, []);
  
  // React Query hooks
  const { data: treks, isLoading: isLoadingTreks, isError: isTripError } = useTrips();
  const { data: permits } = usePermits(selectedTrekId || '');
  const { data: allPermits, isLoading: isLoadingAllPermits } = useAllPermits(selectedTrekId || '');
  const { data: services } = useServices(selectedTrekId || '');
  const { data: allServices, isLoading: isLoadingAllServices } = useAllServices(selectedTrekId || '');
  const { data: extraServices } = useExtraServices(selectedTrekId || '');
  const { data: allExtraServices, isLoading: isLoadingAllExtraServices } = useAllExtraServices(selectedTrekId || '');
  const { data: accommodations } = useAccommodation(selectedTrekId || '');
  const { data: allAccommodations, isLoading: isLoadingAllAccommodations } = useAllAccommodations(selectedTrekId || '');
  const { data: transportations } = useTransportation(selectedTrekId || '');
  const { data: allTransportations, isLoading: isLoadingAllTransportations } = useAllTransportations(selectedTrekId || '');
  
  // Use initial treks while loading real data
  const displayTreks = isLoadingTreks ? initialTreks : (treks || initialTreks);

  // Check if any data is still loading
  const isLoading = isLoadingTreks || (selectedTrekId && (!permits || !services || !extraServices));

  // Function to split rows based on max_capacity and group size
  const splitRowByMaxCapacity = (row: any, groupSize: number) => {
    const rows = [];
    
    if (!row.max_capacity || groupSize <= row.max_capacity) {
      return [{ ...row, no: groupSize }];
    }
    
    // Calculate total number of rows needed using Math.ceil
    const totalRows = Math.ceil(groupSize / row.max_capacity);
    
    for (let i = 0; i < totalRows; i++) {
      // First row keeps original description, additional rows get "Additional" prefix
      const isAdditional = i > 0;
      // Calculate quantity for this row (max_capacity for all but potentially last row)
      const quantity = i === totalRows - 1 ? 
        // For the last row, use remaining capacity if there's a remainder
        (groupSize % row.max_capacity === 0 ? row.max_capacity : groupSize % row.max_capacity) :
        // For other rows, use max_capacity
        row.max_capacity;
      
      rows.push({
        ...row,
        id: `${row.id}-split-${i + 1}`,
        no: quantity,
        description: isAdditional ? `Additional ${row.description}` : row.description
      });
    }
    
    return rows;
  };
  
  const initialData = useMemo(() => {
    const data: any = {};
    const groupSize = 1; 
    
    if (selectedTrekId) {
      data.trekId = selectedTrekId;
      
      if (permits && permits.length > 0) {
        const defaultPermits = permits.filter((permit: any) => permit.is_default === true);
        
        data.permits = {
          id: 'permits',
          name: 'Permits & Documents',
          rows: defaultPermits.flatMap((permit: any) => 
            splitRowByMaxCapacity({
              id: permit.id,
              description: permit.name,
              rate: permit.rate,
              no: groupSize,
              times: permit.times,
              total: calculatePermitTotal(permit, groupSize, permit.times),
              per_person: permit.per_person,
              per_day: permit.per_day,
              one_time: permit.one_time,
              is_default: permit.is_default,
              is_editable: permit.is_editable,
              max_capacity: permit.max_capacity,
              from_place: permit.from_place,
              to_place: permit.to_place,
              location: permit.from_place && permit.to_place ? `${permit.from_place} to ${permit.to_place}` : permit.name
            }, groupSize)
          ),
          discountType: 'amount' as const,
          discountValue: 0,
          discountRemarks: ''
        };
      }
      
      if (services && services.length > 0) {
        const defaultServices = services.filter((service: any) => service.is_default === true);
        
        data.services = {
          id: 'services',
          name: 'Services',
          rows: defaultServices.flatMap((service: any) => 
            splitRowByMaxCapacity({
              id: service.id,
              description: service.name,
              rate: service.rate,
              no: groupSize,
              times: service.times,
              total: calculateServiceTotal(service, groupSize, service.times),
              per_person: service.per_person,
              per_day: service.per_day,
              one_time: service.one_time,
              is_default: service.is_default,
              is_editable: service.is_editable,
              max_capacity: service.max_capacity,
              from_place: service.from_place,
              to_place: service.to_place,
              location: service.from_place && service.to_place ? `${service.from_place} to ${service.to_place}` : service.name
            }, groupSize)
          ),
          discountType: 'amount' as const,
          discountValue: 0,
          discountRemarks: ''
        };
      }
      
      if (extraServices && extraServices.length > 0) {
        const defaultExtraServices = extraServices.filter((extraService: any) => extraService.is_default === true);
        
        data.extraDetails = {
          id: 'extraDetails',
          name: 'Extra Details',
          rows: defaultExtraServices.flatMap((extraService: any) => 
            splitRowByMaxCapacity({
              id: extraService.id,
              description: extraService.description || `${extraService.serviceName} - ${extraService.name}`,
              rate: extraService.rate,
              no: groupSize,
              times: extraService.times,
              total: calculateExtraServiceTotal(extraService, groupSize, extraService.times),
              per_person: extraService.per_person,
              per_day: extraService.per_day,
              one_time: extraService.one_time,
              is_default: extraService.is_default,
              is_editable: extraService.is_editable,
              max_capacity: extraService.max_capacity,
              from_place: extraService.from_place,
              to_place: extraService.to_place,
              location: extraService.from_place && extraService.to_place ? `${extraService.from_place} to ${extraService.to_place}` : (extraService.serviceName || extraService.name)
            }, groupSize)
          ),
          discountType: 'amount' as const,
          discountValue: 0,
          discountRemarks: ''
        };
      }
      
      data.accommodation = {
        id: 'accommodation',
        name: 'Accommodation',
        rows: accommodations && accommodations.length > 0 ? accommodations
          .filter(acc => acc.is_default === true)
          .flatMap(acc => 
            splitRowByMaxCapacity({
              id: acc.id,
              description: acc.name,
              rate: acc.rate,
              no: groupSize,
              times: acc.times,
              total: calculateAccommodationTotal(acc, groupSize, acc.times),
              per_person: acc.per_person,
              per_day: acc.per_day,
              one_time: acc.one_time,
              is_default: acc.is_default,
              is_editable: acc.is_editable,
              max_capacity: acc.max_capacity,
              from_place: acc.from_place,
              to_place: acc.to_place,
              location: acc.from_place ? acc.from_place : acc.name
            }, groupSize)
          ) : [],
        discountType: 'amount' as const,
        discountValue: 0,
        discountRemarks: ''
      };
      
      data.transportation = {
        id: 'transportation',
        name: 'Transportation',
        rows: transportations && transportations.length > 0 ? transportations
          .filter(trans => trans.is_default === true)
          .flatMap(trans => 
            splitRowByMaxCapacity({
              id: trans.id,
              description: trans.name,
              rate: trans.rate,
              no: groupSize,
              times: trans.times,
              total: calculateTransportationTotal(trans, groupSize, trans.times),
              // Include new transportation properties
              per_person: trans.per_person,
              per_day: trans.per_day,
              one_time: trans.one_time,
              is_default: trans.is_default,
              is_editable: trans.is_editable,
              max_capacity: trans.max_capacity,
              from_place: trans.from_place,
              to_place: trans.to_place,
              location: trans.from_place && trans.to_place ? `${trans.from_place} to ${trans.to_place}` : trans.name
            }, groupSize)
          ) : [],
        discountType: 'amount' as const,
        discountValue: 0,
        discountRemarks: ''
      };
    }
    
    return Object.keys(data).length > 0 ? data : undefined;
  }, [selectedTrekId, permits, services, extraServices, accommodations, transportations]);

  // Fetch user data on client side
  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserClient();
        setUser(userData);
      } catch (error) {
        // Keep initial user data if fetch fails
      }
    }
    
    if (!initialUser) {
      fetchUser();
    }
  }, [initialUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  // Handle errors
  if (isTripError) {
    return <TrekCostingPage 
      treks={initialTreks} 
      user={user} 
    />;
  }

  const handleAddPermit = (permitToAdd: any) => {
    if (!initialData) return;
    
    const baseRow = {
      id: crypto.randomUUID(),
      description: permitToAdd.name,
      rate: permitToAdd.rate,
      times: permitToAdd.times,
      per_person: permitToAdd.per_person,
      per_day: permitToAdd.per_day,
      one_time: permitToAdd.one_time,
      is_default: permitToAdd.is_default,
      is_editable: permitToAdd.is_editable,
      max_capacity: permitToAdd.max_capacity,
      from_place: permitToAdd.from_place,
      to_place: permitToAdd.to_place,
      location: permitToAdd.from_place && permitToAdd.to_place ? `${permitToAdd.from_place} to ${permitToAdd.to_place}` : permitToAdd.name
    };
    
    const splitRows = splitRowByMaxCapacity(baseRow, initialData.groupSize || 1);
    
    const rowsWithTotals = splitRows.map(row => ({
      ...row,
      total: calculatePermitTotal(row, row.no, row.times)
    }));
    
    setPermitsOverride((prev: any) => {
      if (prev) {
        return {
          ...prev,
          rows: [...prev.rows, ...rowsWithTotals]
        };
      } else {
        return {
          ...initialData.permits,
          rows: [...initialData.permits.rows, ...rowsWithTotals]
        };
      }
    });
  };

  const handleAddService = (serviceToAdd: any) => {
    if (!initialData) return;
    
    const baseRow = {
      id: crypto.randomUUID(), 
      description: serviceToAdd.name,
      rate: serviceToAdd.rate,
      times: serviceToAdd.times,
      per_person: serviceToAdd.per_person,
      per_day: serviceToAdd.per_day,
      one_time: serviceToAdd.one_time,
      is_default: serviceToAdd.is_default,
      is_editable: serviceToAdd.is_editable,
      max_capacity: serviceToAdd.max_capacity,
      from_place: serviceToAdd.from_place,
      to_place: serviceToAdd.to_place,
      location: serviceToAdd.from_place && serviceToAdd.to_place ? `${serviceToAdd.from_place} to ${serviceToAdd.to_place}` : serviceToAdd.name
    };
    
    const splitRows = splitRowByMaxCapacity(baseRow, initialData.groupSize || 1);
    
    const rowsWithTotals = splitRows.map(row => ({
      ...row,
      total: calculateServiceTotal(row, row.no, row.times)
    }));
    
    setServicesOverride((prev: any) => {
      if (prev) {
        return {
          ...prev,
          rows: [...prev.rows, ...rowsWithTotals]
        };
      } else {
        return {
          ...initialData.services,
          rows: [...initialData.services.rows, ...rowsWithTotals]
        };
      }
    });
  };

  const handleAddExtraService = (extraServiceToAdd: any) => {
    if (!initialData) return;
    
    const baseRow = {
      id: crypto.randomUUID(),
      description: (extraServiceToAdd.service_name && extraServiceToAdd.name) ? `${extraServiceToAdd.service_name} - ${extraServiceToAdd.name}` : (extraServiceToAdd.description || extraServiceToAdd.service_name || extraServiceToAdd.name),
      rate: extraServiceToAdd.rate,
      times: extraServiceToAdd.times,
      per_person: extraServiceToAdd.per_person,
      per_day: extraServiceToAdd.per_day,
      one_time: extraServiceToAdd.one_time,
      is_default: extraServiceToAdd.is_default,
      is_editable: extraServiceToAdd.is_editable,
      max_capacity: extraServiceToAdd.max_capacity,
      from_place: extraServiceToAdd.from_place,
      to_place: extraServiceToAdd.to_place,
      location: extraServiceToAdd.from_place && extraServiceToAdd.to_place ? `${extraServiceToAdd.from_place} to ${extraServiceToAdd.to_place}` : (extraServiceToAdd.service_name || extraServiceToAdd.name)
    };
    
    const splitRows = splitRowByMaxCapacity(baseRow, initialData.groupSize || 1);
    
    const rowsWithTotals = splitRows.map(row => ({
      ...row,
      total: calculateExtraServiceTotal(row, row.no, row.times)
    }));
    
    setExtraServicesOverride((prev: any) => {
      if (prev) {
        return {
          ...prev,
          rows: [...prev.rows, ...rowsWithTotals]
        };
      } else {
        return {
          ...initialData.extraDetails,
          rows: [...initialData.extraDetails.rows, ...rowsWithTotals]
        };
      }
    });
  };
  
  const handleAddAccommodation = (accommodationToAdd: any) => {
    if (!initialData) return;
    
    const baseRow = {
      id: crypto.randomUUID(),
      description: accommodationToAdd.name,
      rate: accommodationToAdd.rate,
      times: accommodationToAdd.times,
      per_person: accommodationToAdd.per_person,
      per_day: accommodationToAdd.per_day,
      one_time: accommodationToAdd.one_time,
      is_default: accommodationToAdd.is_default,
      is_editable: accommodationToAdd.is_editable,
      max_capacity: accommodationToAdd.max_capacity,
      from_place: accommodationToAdd.from_place,
      to_place: accommodationToAdd.to_place,
      location: accommodationToAdd.from_place ? accommodationToAdd.from_place : accommodationToAdd.name
    };
    
    const splitRows = splitRowByMaxCapacity(baseRow, initialData.groupSize || 1);
    const rowsWithTotals = splitRows.map(row => ({
      ...row,
      total: calculateAccommodationTotal(row, row.no, row.times)
    }));
    
    setAccommodationOverride((prev: any) => {
      if (prev) {
        return {
          ...prev,
          rows: [...prev.rows, ...rowsWithTotals]
        };
      } else {
        return {
          ...initialData.accommodation,
          rows: [...initialData.accommodation.rows, ...rowsWithTotals]
        };
      }
    });
  };
  
  const handleAddTransportation = (transportationToAdd: any) => {
    if (!initialData) return;
    
    const baseRow = {
      id: crypto.randomUUID(),
      description: transportationToAdd.name,
      rate: transportationToAdd.rate,
      times: transportationToAdd.times,
      per_person: transportationToAdd.per_person,
      per_day: transportationToAdd.per_day,
      one_time: transportationToAdd.one_time,
      is_default: transportationToAdd.is_default,
      is_editable: transportationToAdd.is_editable,
      max_capacity: transportationToAdd.max_capacity,
      from_place: transportationToAdd.from_place,
      to_place: transportationToAdd.to_place,
      location: transportationToAdd.from_place && transportationToAdd.to_place ? `${transportationToAdd.from_place} to ${transportationToAdd.to_place}` : transportationToAdd.name
    };
    
    const splitRows = splitRowByMaxCapacity(baseRow, initialData.groupSize || 1);
    
    const rowsWithTotals = splitRows.map(row => ({
      ...row,
      total: calculateTransportationTotal(row, row.no, row.times)
    }));
    
    setTransportationOverride((prev: any) => {
      if (prev) {
        return {
          ...prev,
          rows: [...prev.rows, ...rowsWithTotals]
        };
      } else {
        return {
          ...initialData.transportation,
          rows: [...initialData.transportation.rows, ...rowsWithTotals]
        };
      }
    });
  };

  let finalInitialData = initialData;
  if (initialData) {
    finalInitialData = {
      ...initialData,
      ...(permitsOverride ? { permits: permitsOverride } : {}),
      ...(servicesOverride ? { services: servicesOverride } : {}),
      ...(extraServicesOverride ? { extraDetails: extraServicesOverride } : {}),
      ...(accommodationOverride ? { accommodation: accommodationOverride } : {}),
      ...(transportationOverride ? { transportation: transportationOverride } : {}),
      accommodation: initialData?.accommodation || {
        id: 'accommodation',
        name: 'Accommodation',
        rows: [],
        discountType: 'amount',
        discountValue: 0,
        discountRemarks: ''
      },
      transportation: initialData?.transportation || {
        id: 'transportation',
        name: 'Transportation',
        rows: [],
        discountType: 'amount',
        discountValue: 0,
        discountRemarks: ''
      },
      extraServices: initialData?.extraServices || {
        id: 'extraServices',
        name: 'Extra Services',
        rows: [],
        discountType: 'amount',
        discountValue: 0,
        discountRemarks: ''
      }
    };
  }

  return <TrekCostingPage 
    treks={displayTreks}
    user={user} 
    {...(selectedTrekId ? { initialData: finalInitialData } : {})}
    onTrekSelect={handleTrekSelect}
    onAddPermit={handleAddPermit}
    onAddService={handleAddService}
    onAddExtraService={handleAddExtraService}
    onAddAccommodation={handleAddAccommodation}
    onAddTransportation={handleAddTransportation}
    allPermits={allPermits}
    allServices={allServices}
    allExtraServices={allExtraServices}
    allAccommodations={allAccommodations}
    allTransportations={allTransportations}
    isLoadingAllPermits={isLoadingAllPermits}
    isLoadingAllServices={isLoadingAllServices}
    isLoadingAllExtraServices={isLoadingAllExtraServices}
    isLoadingAllAccommodations={isLoadingAllAccommodations}
    isLoadingAllTransportations={isLoadingAllTransportations}
  />;
}