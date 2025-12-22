"use client";
import { useState, useEffect, useMemo } from 'react';
import { ExtraServicesClientPage } from "@/components/extra-services/extra-services-client-page";
import { useQuery } from '@tanstack/react-query';
import { usePermits } from '@/hooks/use-permits';
import { useServices } from '@/hooks/use-services';
import { useExtraServices } from '@/hooks/use-extra-services';
import { fetchGroupAndPackageById } from '@/lib/api-service';
import { Loader2 } from 'lucide-react';
import { getUserClient } from '@/lib/auth-client';

interface User {
  name: string;
  email: string;
  role: string;
}

interface ExtraServicesWrapperProps {
  user: User | null;
  groupId?: string;
}

export function ExtraServicesWrapper({ user: initialUser, groupId }: ExtraServicesWrapperProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  
  console.log('ExtraServicesWrapper: groupId =', groupId);
  
  // Fetch the group/package data from the API if groupId is provided
  const { data: groupData, isLoading: isLoadingGroup, error: groupError } = useQuery({
    queryKey: ['group-package', groupId],
    queryFn: () => fetchGroupAndPackageById(groupId!),
    enabled: !!groupId,
    retry: 1,
  });
  
  // Extract trekId from the fetched group data
  const trekId = groupData?.trekId || '';
  
  console.log('ExtraServicesWrapper: trekId from group =', trekId);
  
  // Fetch permits/services/extra-services based on trekId (same as cost-estimator)
  const { data: permits, isLoading: isLoadingPermits } = usePermits(trekId);
  const { data: services, isLoading: isLoadingServices } = useServices(trekId);
  const { data: extraServices, isLoading: isLoadingExtraServices } = useExtraServices(trekId);
  
  const isLoading = isLoadingGroup || (trekId ? (isLoadingPermits || isLoadingServices || isLoadingExtraServices) : false);

  // Prepare initialData with fetched data (same structure as cost-estimator)
  const initialData = useMemo(() => {
    if (!groupData) return null;

    const data: any = { ...groupData };
    
    console.log('ExtraServicesWrapper: Building initialData', {
      hasGroupData: !!groupData,
      hasTrekId: !!trekId,
      hasPermits: !!permits,
      hasServices: !!services,
      hasExtraServices: !!extraServices
    });
    
    // If we have fetched permits, populate them (same as cost-estimator)
    if (permits && permits.length > 0) {
      data.permits = {
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
    
    // If we have fetched services, populate them (same as cost-estimator)
    if (services && services.length > 0) {
      data.services = {
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
    
    // If we have fetched extra services, populate them (same as cost-estimator)
    if (extraServices && extraServices.length > 0) {
      data.extraDetails = {
        id: 'extraDetails',
        name: 'Extra Details',
        rows: extraServices.flatMap((extraService: any) => {
          if (extraService.params && extraService.params.length > 0) {
            return extraService.params.map((param: any, index: number) => ({
              id: `${extraService.id}-${index}`,
              description: param.name,
              rate: param.rate,
              no: 1,
              times: extraService.times,
              total: param.rate * extraService.times
            }));
          } else {
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
    
    console.log('ExtraServicesWrapper: Final initialData', {
      permitsCount: data.permits?.rows?.length || 0,
      servicesCount: data.services?.rows?.length || 0,
      extraDetailsCount: data.extraDetails?.rows?.length || 0
    });
    
    return data;
  }, [groupData, trekId, permits, services, extraServices]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getUserClient();
        setUser(userData);
      } catch (error) {
        // Silently fail, keep existing user
      }
    }
    
    if (!initialUser) {
      fetchUser();
    }
  }, [initialUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading data from API...</p>
      </div>
    );
  }
  
  if (groupError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
        <p className="text-destructive">Error loading group data: {(groupError as Error).message}</p>
        <p className="mt-2 text-muted-foreground">Please check if the group ID exists in the system.</p>
      </div>
    );
  }

  return <ExtraServicesClientPage 
    user={user} 
    initialData={initialData}
    groupId={groupId}
  />;
}
