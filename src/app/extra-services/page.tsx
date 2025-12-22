import React from "react";
import { ExtraServicesWrapper } from "@/components/extra-services/extra-services-wrapper";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';
import type { User } from '@/lib/auth';

interface ExtraServicesPageProps {
  searchParams: Promise<{
    groupId?: string;
  }>;
}

export default async function ExtraServicesPage({ searchParams }: ExtraServicesPageProps) {
  const user: User | null = await getUser();
  const { groupId } = await searchParams;

  // Don't fetch data on the server side - let the client component handle it via API
  // This allows it to use the same data fetching pattern as cost-estimator

  return (
    <DashboardLayout user={user}>
      <ExtraServicesWrapper user={user} groupId={groupId} />
    </DashboardLayout>
  );
}