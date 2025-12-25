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
  
  // Function to calculate permit total based on the new permit properties
  const calculatePermitTotal = (permit: any, no: number, times: number) => {
    let total = permit.rate;
    
    // If it's per_person, multiply by number of people
    if (permit.per_person) {
      total *= no;
    }
    
    // If it's per_day, multiply by number of days/times
    if (permit.per_day) {
      total *= times;
    }
    
    // If it's one_time, it's a single occurrence regardless of other factors
    if (permit.one_time) {
      // For one_time permits, we don't multiply by no or times
      // unless they're also per_person or per_day
      total = permit.rate;
      
      // But if it's also per_person, apply that calculation
      if (permit.per_person) {
        total *= no;
      }
      
      // If it's also per_day, apply that calculation
      if (permit.per_day) {
        total *= times;
      }
    }
    
    return total;
  };
  
  // Function to calculate service total based on the new service properties
  const calculateServiceTotal = (service: any, no: number, times: number) => {
    let total = service.rate;
    
    // If it's per_person, multiply by number of people
    if (service.per_person) {
      total *= no;
    }
    
    // If it's per_day, multiply by number of days/times
    if (service.per_day) {
      total *= times;
    }
    
    // If it's one_time, it's a single occurrence regardless of other factors
    if (service.one_time) {
      // For one_time services, we don't multiply by no or times
      // unless they're also per_person or per_day
      total = service.rate;
      
      // But if it's also per_person, apply that calculation
      if (service.per_person) {
        total *= no;
      }
      
      // If it's also per_day, apply that calculation
      if (service.per_day) {
        total *= times;
      }
    }
    
    return total;
  };
  
  // Function to calculate extra service total based on the new extra service properties
  const calculateExtraServiceTotal = (extraService: any, no: number, times: number) => {
    let total = extraService.rate;
    
    // If it's per_person, multiply by number of people
    if (extraService.per_person) {
      total *= no;
    }
    
    // If it's per_day, multiply by number of days/times
    if (extraService.per_day) {
      total *= times;
    }
    
    // If it's one_time, it's a single occurrence regardless of other factors
    if (extraService.one_time) {
      // For one_time extra services, we don't multiply by no or times
      // unless they're also per_person or per_day
      total = extraService.rate;
      
      // But if it's also per_person, apply that calculation
      if (extraService.per_person) {
        total *= no;
      }
      
      // If it's also per_day, apply that calculation
      if (extraService.per_day) {
        total *= times;
      }
    }
    
    return total;
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
  
  // Use initial treks while loading real data
  const displayTreks = isLoadingTreks ? initialTreks : (treks || initialTreks);

  // Check if any data is still loading
  const isLoading = isLoadingTreks || (selectedTrekId && (!permits || !services || !extraServices));

  // Function to split rows based on max_capacity and group size
  const splitRowByMaxCapacity = (row: any, groupSize: number) => {
    const rows = [];
    
    // If max_capacity is not defined or group size is less than or equal to max_capacity, return original row
    if (!row.max_capacity || groupSize <= row.max_capacity) {
      return [{ ...row, no: groupSize }];
    }
    
    // Create the first row with max_capacity quantity
    const firstRow = {
      ...row,
      id: `${row.id}-split-1`,
      no: row.max_capacity,
      description: `${row.description} (max capacity)`
    };
    
    // Calculate remaining capacity
    const remainingCapacity = groupSize - row.max_capacity;
    
    // Create additional row with remaining capacity
    const additionalRow = {
      ...row,
      id: `${row.id}-split-2`,
      no: remainingCapacity,
      description: `${row.description} (additional capacity)`
    };
    
    rows.push(firstRow);
    rows.push(additionalRow);
    
    return rows;
  };
  
  // Prepare initialData for the costing page - memoize to avoid recreating on every render
  const initialData = useMemo(() => {
    const data: any = {};
    const groupSize = 1; // Initial group size is 1
    
    if (selectedTrekId) {
      data.trekId = selectedTrekId;
      
      if (permits && permits.length > 0) {
        // Only include permits that are default (is_default: true)
        const defaultPermits = permits.filter((permit: any) => permit.is_default === true);
        
        data.permits = {
          id: 'permits',
          name: 'Permits & Food',
          rows: defaultPermits.flatMap((permit: any) => 
            splitRowByMaxCapacity({
              id: permit.id,
              description: permit.name,
              rate: permit.rate,
              no: groupSize,
              times: permit.times,
              total: calculatePermitTotal({ ...permit, no: groupSize }, groupSize, permit.times),
              // Include new permit properties
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
        // Only include services that are default (is_default: true)
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
              total: calculateServiceTotal({ ...service, no: groupSize }, groupSize, service.times),
              // Include new service properties
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
        // Only include extra services that are default (is_default: true)
        const defaultExtraServices = extraServices.filter((extraService: any) => extraService.is_default === true);
        
        data.extraDetails = {
          id: 'extraDetails',
          name: 'Extra Details',
          rows: defaultExtraServices.flatMap((extraService: any) => {
            if (extraService.params && extraService.params.length > 0) {
              // Create separate rows for each param and split by max_capacity
              return extraService.params.flatMap((param: any, index: number) => 
                splitRowByMaxCapacity({
                  id: `${extraService.id}-${index}`,
                  description: `${extraService.serviceName} - ${param.name}`,
                  rate: param.rate,
                  no: groupSize,
                  times: extraService.times,
                  total: calculateExtraServiceTotal({ ...param, no: groupSize }, groupSize, extraService.times),
                  // Include new extra service properties
                  per_person: extraService.per_person,
                  per_day: extraService.per_day,
                  one_time: extraService.one_time,
                  is_default: extraService.is_default,
                  is_editable: extraService.is_editable,
                  max_capacity: extraService.max_capacity,
                  from_place: extraService.from_place,
                  to_place: extraService.to_place,
                  location: extraService.from_place && extraService.to_place ? `${extraService.from_place} to ${extraService.to_place}` : extraService.name
                }, groupSize)
              );
            } else {
              return splitRowByMaxCapacity({
                id: extraService.id,
                description: extraService.serviceName,
                rate: 0,
                no: groupSize,
                times: extraService.times,
                total: 0,
                // Include new extra service properties
                per_person: extraService.per_person,
                per_day: extraService.per_day,
                one_time: extraService.one_time,
                is_default: extraService.is_default,
                is_editable: extraService.is_editable,
                max_capacity: extraService.max_capacity,
                from_place: extraService.from_place,
                to_place: extraService.to_place,
                location: extraService.from_place && extraService.to_place ? `${extraService.from_place} to ${extraService.to_place}` : extraService.name
              }, groupSize);
            }
          }),
          discountType: 'amount' as const,
          discountValue: 0,
          discountRemarks: ''
        };
      }
    }
    
    return Object.keys(data).length > 0 ? data : undefined;
  }, [selectedTrekId, permits, services, extraServices]);

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

  // Function to add a new permit to the permits section
  const handleAddPermit = (permitToAdd: any) => {
    if (!initialData) return;
    
    // Create a new permit row with all the required properties
    const newPermitRow = {
      id: crypto.randomUUID(), // Generate a unique ID for each added permit
      description: permitToAdd.name,
      rate: permitToAdd.rate,
      no: initialData.groupSize || 1,
      times: permitToAdd.times,
      total: calculatePermitTotal({ ...permitToAdd, no: initialData.groupSize || 1 }, initialData.groupSize || 1, permitToAdd.times),
      // Include new permit properties
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
    
    // Update the permits override state
    setPermitsOverride((prev: any) => {
      if (prev) {
        return {
          ...prev,
          rows: [...prev.rows, newPermitRow]
        };
      } else {
        return {
          ...initialData.permits,
          rows: [...initialData.permits.rows, newPermitRow]
        };
      }
    });
  };

  // Function to add a new service to the services section
  const handleAddService = (serviceToAdd: any) => {
    if (!initialData) return;
    
    // Create a new service row with all the required properties
    const newServiceRow = {
      id: crypto.randomUUID(), // Generate a unique ID for each added service
      description: serviceToAdd.name,
      rate: serviceToAdd.rate,
      no: initialData.groupSize || 1,
      times: serviceToAdd.times,
      total: calculateServiceTotal({ ...serviceToAdd, no: initialData.groupSize || 1 }, initialData.groupSize || 1, serviceToAdd.times),
      // Include new service properties
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
    
    // Update the services override state
    setServicesOverride((prev: any) => {
      if (prev) {
        return {
          ...prev,
          rows: [...prev.rows, newServiceRow]
        };
      } else {
        return {
          ...initialData.services,
          rows: [...initialData.services.rows, newServiceRow]
        };
      }
    });
  };

  // Function to add a new extra service to the extra services section
  const handleAddExtraService = (extraServiceToAdd: any) => {
    if (!initialData) return;
    
    // Create a new extra service row with all the required properties
    const newExtraServiceRow = {
      id: crypto.randomUUID(), // Generate a unique ID for each added extra service
      description: (extraServiceToAdd.serviceName && extraServiceToAdd.name) ? `${extraServiceToAdd.serviceName} - ${extraServiceToAdd.name}` : (extraServiceToAdd.description || extraServiceToAdd.serviceName || extraServiceToAdd.name),
      rate: extraServiceToAdd.rate,
      no: initialData.groupSize || 1,
      times: extraServiceToAdd.times,
      total: calculateExtraServiceTotal({ ...extraServiceToAdd, no: initialData.groupSize || 1 }, initialData.groupSize || 1, extraServiceToAdd.times),
      // Include new extra service properties
      per_person: extraServiceToAdd.per_person,
      per_day: extraServiceToAdd.per_day,
      one_time: extraServiceToAdd.one_time,
      is_default: extraServiceToAdd.is_default,
      is_editable: extraServiceToAdd.is_editable,
      max_capacity: extraServiceToAdd.max_capacity,
      from_place: extraServiceToAdd.from_place,
      to_place: extraServiceToAdd.to_place,
      location: extraServiceToAdd.from_place && extraServiceToAdd.to_place ? `${extraServiceToAdd.from_place} to ${extraServiceToAdd.to_place}` : (extraServiceToAdd.serviceName || extraServiceToAdd.name)
    };
    
    // Update the extra services override state
    setExtraServicesOverride((prev: any) => {
      if (prev) {
        return {
          ...prev,
          rows: [...prev.rows, newExtraServiceRow]
        };
      } else {
        return {
          ...initialData.extraDetails,
          rows: [...initialData.extraDetails.rows, newExtraServiceRow]
        };
      }
    });
  };

  // Use permitsOverride, servicesOverride, and extraServicesOverride if available, otherwise use initialData
  let finalInitialData = initialData;
  if (initialData) {
    finalInitialData = {
      ...initialData,
      ...(permitsOverride ? { permits: permitsOverride } : {}),
      ...(servicesOverride ? { services: servicesOverride } : {}),
      ...(extraServicesOverride ? { extraDetails: extraServicesOverride } : {})
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
    allPermits={allPermits}
    allServices={allServices}
    allExtraServices={allExtraServices}
    isLoadingAllPermits={isLoadingAllPermits}
    isLoadingAllServices={isLoadingAllServices}
    isLoadingAllExtraServices={isLoadingAllExtraServices}
  />;
}