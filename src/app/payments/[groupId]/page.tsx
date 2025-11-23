
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PaymentPageContent } from "@/components/dashboard/payment-page-content";
import { getReportByGroupId } from "@/app/api/data";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";

interface PaymentPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { groupId } = await params;
  const user = await getUser();
  const report = getReportByGroupId(groupId);

  if (!report) {
    notFound();
  }

  return (
    <DashboardLayout user={user}>
      <PaymentPageContent initialReport={report} />
    </DashboardLayout>
  );
}
