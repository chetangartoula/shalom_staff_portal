import React from "react";
import { ExtraServicesClientPage } from "@/components/extra-services/extra-services-client-page";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';
import { getReportByGroupId } from '@/app/api/data';
import { notFound } from 'next/navigation';
import type { User } from '@/lib/auth';

interface ExtraServicesPageProps {
  searchParams: Promise<{
    groupId?: string;
  }>;
}

export default async function ExtraServicesPage({ searchParams }: ExtraServicesPageProps) {
  const user: User | null = await getUser();
  const { groupId } = await searchParams;

  let initialData = null;
  if (groupId) {
    initialData = getReportByGroupId(groupId);
    if (!initialData) {
      notFound();
    }
  }

  return (
    <DashboardLayout user={user}>
      <ExtraServicesClientPage user={user} initialData={initialData} />
    </DashboardLayout>
  );
}