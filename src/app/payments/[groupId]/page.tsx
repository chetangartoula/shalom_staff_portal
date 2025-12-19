import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PaymentPageContent } from "@/components/dashboard/payment-page-content";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { fetchGroupAndPackageById } from "@/lib/api-service";

interface PaymentPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { groupId } = await params;
  const user = await getUser();
  
  try {
    // Fetch report data from the real API
    const report = await fetchGroupAndPackageById(groupId);
    
    if (!report) {
      notFound();
    }
    
    return (
      <DashboardLayout user={user}>
        <PaymentPageContent initialReport={report} />
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error fetching report from API:', error);
    // If API fails, try to fallback to mock data
    try {
      const { getReportByGroupId } = await import("@/app/api/data");
      const report = getReportByGroupId(groupId);
      
      if (!report) {
        notFound();
      }
      
      return (
        <DashboardLayout user={user}>
          <PaymentPageContent initialReport={report} />
        </DashboardLayout>
      );
    } catch (mockError) {
      console.error('Error fetching report from mock data:', mockError);
      notFound();
    }
  }
}