"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrekCostingPage } from "@/components/dashboard/trek-costing-page";
import type { Trek, CostRow } from "@/lib/types";
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

  // Calculation Utilities
  const calculateRowQuantity = useCallback((item: any, groupSize: number) => {
    if (item.max_capacity && item.max_capacity > 0) {
      return Math.ceil(groupSize / item.max_capacity);
    }
    if (item.per_person) {
      return groupSize;
    }
    return 1;
  }, []);

  const calculateRowTimes = useCallback((item: any, trekTimes: number) => {
    if (item.per_day) {
      return trekTimes;
    }
    if (item.one_time) {
      return 1;
    }
    return 1;
  }, []);

  const calculateRowTotal = useCallback((item: any, no: number, times: number) => {
    const rate = item.rate || 0;
    
    // Apply calculation based on boolean flags
    if (item.one_time) {
      // If one_time is true, calculate as rate (single occurrence regardless of other factors)
      return rate;
    } else if (item.per_person && item.per_day) {
      // If both per_person and per_day are true, calculate as rate * no * times
      return rate * no * times;
    } else if (item.per_person) {
      // If per_person is true, calculate as rate * no
      return rate * no;
    } else if (item.per_day) {
      // If per_day is true, calculate as rate * times
      return rate * times;
    } else {
      // If none of the above flags are true, calculate as rate * no * times (default)
      return rate * no * times;
    }
  }, []);

  // Hooks
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

  const displayTreks = isLoadingTreks ? initialTreks : (treks || initialTreks);
  const isLoading = isLoadingTreks || (selectedTrekId && (!permits || !services || !extraServices));

  // Row update helper
  const updateRowsWithTripTimes = useCallback((rows: any[], trekTimes: number, groupSize: number) => {
    return rows.map(row => {
      const newNo = calculateRowQuantity(row, groupSize);
      const newTimes = calculateRowTimes(row, trekTimes);
      return {
        ...row,
        no: newNo,
        times: newTimes,
        total: calculateRowTotal(row, newNo, newTimes),
        // Ensure description is properly mapped from name if missing
        description: row.description || (row as any).name || '',
      };
    });
  }, [calculateRowQuantity, calculateRowTotal]);

  // Initial Data Memo
  const initialData = useMemo(() => {
    const data: any = { groupSize: 1 };
    if (!selectedTrekId) return undefined;

    data.trekId = selectedTrekId;
    const selectedTrek = displayTreks?.find((t: any) => t.id === selectedTrekId);
    const trekTimes = selectedTrek?.times || 1;
    const groupSize = data.groupSize;

    if (permits) {
      const defaultPermits = permits.filter((p: any) => p.is_default);
      data.permits = {
        id: 'permits',
        name: 'Permits & Documents',
        rows: updateRowsWithTripTimes(defaultPermits, trekTimes, groupSize).map(p => ({
          ...p,
          location: p.from_place && p.to_place ? `${p.from_place} to ${p.to_place}` : p.name
        })),
        discountType: 'amount',
        discountValue: 0,
        discountRemarks: ''
      };
    }

    if (services) {
      const defaultServices = services.filter((s: any) => s.is_default);
      data.services = {
        id: 'services',
        name: 'Services',
        rows: updateRowsWithTripTimes(defaultServices, trekTimes, groupSize).map(s => ({
          ...s,
          location: s.from_place && s.to_place ? `${s.from_place} to ${s.to_place}` : s.name
        })),
        discountType: 'amount',
        discountValue: 0,
        discountRemarks: ''
      };
    }

    if (extraServices) {
      const defaultExtra = extraServices.filter((e: any) => e.is_default);
      data.extraDetails = {
        id: 'extraDetails',
        name: 'Extra Details',
        rows: updateRowsWithTripTimes(defaultExtra, trekTimes, groupSize),
        discountType: 'amount',
        discountValue: 0,
        discountRemarks: ''
      };
    }

    data.accommodation = {
      id: 'accommodation',
      name: 'Accommodation',
      rows: accommodations ?
        updateRowsWithTripTimes(accommodations.filter(a => a.is_default), trekTimes, groupSize)
          .map(a => ({ ...a, location: a.from_place || a.name }))
        : [],
      discountType: 'amount',
      discountValue: 0,
      discountRemarks: ''
    };

    data.transportation = {
      id: 'transportation',
      name: 'Transportation',
      rows: transportations ?
        updateRowsWithTripTimes(transportations.filter(t => t.is_default), trekTimes, groupSize)
          .map(t => ({ ...t, location: t.from_place && t.to_place ? `${t.from_place} to ${t.to_place}` : t.name }))
        : [],
      discountType: 'amount',
      discountValue: 0,
      discountRemarks: ''
    };

    return data;
  }, [selectedTrekId, permits, services, extraServices, accommodations, transportations, displayTreks, updateRowsWithTripTimes]);

  const handleTrekSelect = useCallback((trekId: string) => {
    setSelectedTrekId(trekId);
  }, []);

  // Handlers
  const handleAddPermit = useCallback((item: any) => {
    if (!initialData) return;
    const selectedTrek = displayTreks?.find((t: any) => t.id === selectedTrekId);
    const trekTimes = selectedTrek?.times || 1;
    const groupSize = initialData.groupSize || 1;
    const itemTimes = calculateRowTimes(item, trekTimes);
    const itemNo = calculateRowQuantity(item, groupSize);

    const newRow = {
      ...item,
      id: crypto.randomUUID(),
      description: item.name,
      no: itemNo,
      times: itemTimes,
      total: calculateRowTotal(item, itemNo, itemTimes),
      location: item.from_place && item.to_place ? `${item.from_place} to ${item.to_place}` : item.name
    };

    setPermitsOverride((prev: any) => ({
      ...(prev || initialData.permits),
      rows: [...(prev?.rows || initialData.permits.rows), newRow]
    }));
  }, [initialData, selectedTrekId, displayTreks, calculateRowQuantity, calculateRowTotal]);

  const handleAddService = useCallback((item: any) => {
    if (!initialData) return;
    const selectedTrek = displayTreks?.find((t: any) => t.id === selectedTrekId);
    const trekTimes = selectedTrek?.times || 1;
    const groupSize = initialData.groupSize || 1;
    const itemTimes = calculateRowTimes(item, trekTimes);
    const itemNo = calculateRowQuantity(item, groupSize);

    const newRow = {
      ...item,
      id: crypto.randomUUID(),
      description: item.name,
      no: itemNo,
      times: itemTimes,
      total: calculateRowTotal(item, itemNo, itemTimes),
      location: item.from_place && item.to_place ? `${item.from_place} to ${item.to_place}` : item.name
    };

    setServicesOverride((prev: any) => ({
      ...(prev || initialData.services),
      rows: [...(prev?.rows || initialData.services.rows), newRow]
    }));
  }, [initialData, selectedTrekId, displayTreks, calculateRowQuantity, calculateRowTotal]);

  const handleAddExtraService = useCallback((item: any) => {
    if (!initialData) return;
    const selectedTrek = displayTreks?.find((t: any) => t.id === selectedTrekId);
    const trekTimes = selectedTrek?.times || 1;
    const groupSize = initialData.groupSize || 1;
    const itemTimes = calculateRowTimes(item, trekTimes);
    const itemNo = calculateRowQuantity(item, groupSize);

    const newRow = {
      ...item,
      id: crypto.randomUUID(),
      description: item.service_name && item.name ? `${item.service_name} - ${item.name}` : (item.description || item.service_name || item.name),
      no: itemNo,
      times: itemTimes,
      total: calculateRowTotal(item, itemNo, itemTimes),
    };

    setExtraServicesOverride((prev: any) => ({
      ...(prev || initialData.extraDetails),
      rows: [...(prev?.rows || initialData.extraDetails.rows), newRow]
    }));
  }, [initialData, selectedTrekId, displayTreks, calculateRowQuantity, calculateRowTotal]);

  const handleAddAccommodation = useCallback((item: any) => {
    if (!initialData) return;
    const selectedTrek = displayTreks?.find((t: any) => t.id === selectedTrekId);
    const trekTimes = selectedTrek?.times || 1;
    const groupSize = initialData.groupSize || 1;
    const itemTimes = calculateRowTimes(item, trekTimes);
    const itemNo = calculateRowQuantity(item, groupSize);

    const newRow = {
      ...item,
      id: crypto.randomUUID(),
      description: item.name,
      no: itemNo,
      times: itemTimes,
      total: calculateRowTotal(item, itemNo, itemTimes),
      location: item.from_place || item.name
    };

    setAccommodationOverride((prev: any) => ({
      ...(prev || initialData.accommodation),
      rows: [...(prev?.rows || initialData.accommodation.rows), newRow]
    }));
  }, [initialData, selectedTrekId, displayTreks, calculateRowQuantity, calculateRowTotal]);

  const handleAddTransportation = useCallback((item: any) => {
    if (!initialData) return;
    const selectedTrek = displayTreks?.find((t: any) => t.id === selectedTrekId);
    const trekTimes = selectedTrek?.times || 1;
    const groupSize = initialData.groupSize || 1;
    const itemTimes = calculateRowTimes(item, trekTimes);
    const itemNo = calculateRowQuantity(item, groupSize);

    const newRow = {
      ...item,
      id: crypto.randomUUID(),
      description: item.name,
      no: itemNo,
      times: itemTimes,
      total: calculateRowTotal(item, itemNo, itemTimes),
      location: item.from_place && item.to_place ? `${item.from_place} to ${item.to_place}` : item.name
    };

    setTransportationOverride((prev: any) => ({
      ...(prev || initialData.transportation),
      rows: [...(prev?.rows || initialData.transportation.rows), newRow]
    }));
  }, [initialData, selectedTrekId, displayTreks, calculateRowQuantity, calculateRowTotal]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserClient();
        setUser(userData);
      } catch (error) { }
    }
    if (!initialUser) fetchUser();
  }, [initialUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  if (isTripError) {
    return <TrekCostingPage treks={initialTreks} user={user} />;
  }

  const mergedInitialData = initialData ? {
    ...initialData,
    permits: permitsOverride || initialData.permits,
    services: servicesOverride || initialData.services,
    extraDetails: extraServicesOverride || initialData.extraDetails,
    accommodation: accommodationOverride || initialData.accommodation,
    transportation: transportationOverride || initialData.transportation,
  } : undefined;

  return (
    <TrekCostingPage
      treks={displayTreks}
      user={user}
      initialData={mergedInitialData}
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
    />
  );
}