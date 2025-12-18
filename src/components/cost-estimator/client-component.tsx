"use client";

import { useState, useEffect, useCallback } from 'react';
import { TrekCostingPage } from "@/components/dashboard/trek-costing-page";
import type { Trek } from "@/lib/types";
import { useTrips } from '@/hooks/use-trips';
import { usePermits } from '@/hooks/use-permits';
import { useServices } from '@/hooks/use-services';
import { useExtraServices } from '@/hooks/use-extra-services';
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

export function ClientCostEstimator({ initialTreks, user: initialUser }: ClientCostEstimatorProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [selectedTrekId, setSelectedTrekId] = useState<string | null>(null);
  
  // Handle trek selection
  const handleTrekSelect = useCallback((trekId: string) => {
    setSelectedTrekId(trekId);
  }, []);
  
  // React Query hooks
  const { data: treks, isLoading: isLoadingTreks, isError: isTripError } = useTrips();
  const { data: permits } = usePermits(selectedTrekId || '');
  const { data: services } = useServices(selectedTrekId || '');
  const { data: extraServices } = useExtraServices(selectedTrekId || '');
  
  // Use initial treks while loading real data
  const displayTreks = isLoadingTreks ? initialTreks : (treks || initialTreks);

  // Check if any data is still loading
  const isLoading = isLoadingTreks || (selectedTrekId && (!permits || !services || !extraServices));

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

  // Prepare initialData for the costing page
  const initialData: any = {};
  
  if (selectedTrekId) {
    initialData.trekId = selectedTrekId;
    
    // Add permits data if available
    if (permits && permits.length > 0) {
      initialData.permits = {
        id: 'permits',
        name: 'Permits & Food',
        rows: permits.map((permit: any) => ({
          id: permit.id,
          description: permit.name,
          rate: permit.rate,
          no: 1,
          times: permit.times,
          total: permit.rate * permit.times
        })),
        discountType: 'amount' as const,
        discountValue: 0,
        discountRemarks: ''
      };
    }
    
    // Add services data if available
    if (services && services.length > 0) {
      initialData.services = {
        id: 'services',
        name: 'Services',
        rows: services.map((service: any) => ({
          id: service.id,
          description: service.name,
          rate: service.rate,
          no: 1,
          times: service.times,
          total: service.rate * service.times
        })),
        discountType: 'amount' as const,
        discountValue: 0,
        discountRemarks: ''
      };
    }
    
    // Add extra services data if available
    if (extraServices && extraServices.length > 0) {
      initialData.extraDetails = {
        id: 'extraDetails',
        name: 'Extra Details',
        rows: extraServices.flatMap((extraService: any) => {
          if (extraService.params && extraService.params.length > 0) {
            // Create separate rows for each param
            return extraService.params.map((param: any, index: number) => ({
              id: `${extraService.id}-${index}`,
              description: param.name,
              rate: param.rate,
              no: 1,
              times: extraService.times,
              total: param.rate * extraService.times
            }));
          } else {
            // If no params, create a single row with the service name
            return {
              id: extraService.id,
              description: extraService.serviceName,
              rate: 0,
              no: 1,
              times: extraService.times,
              total: 0
            };
          }
        }),
        discountType: 'amount' as const,
        discountValue: 0,
        discountRemarks: ''
      };
    }
  }

  return <TrekCostingPage 
    treks={displayTreks}
    user={user} 
    {...(selectedTrekId ? { initialData } : {})}
    onTrekSelect={handleTrekSelect}
  />;
}