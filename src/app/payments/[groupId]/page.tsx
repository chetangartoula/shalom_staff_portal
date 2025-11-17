
import { DashboardLayoutShell } from "@/components/dashboard-layout-shell";
import { PaymentPageContent } from "@/components/payment-page-content";
import { getReportByGroupId } from "@/app/api/data";
import { notFound } from "next/navigation";

interface PaymentPageProps {
  params: {
    groupId: string;
  };
}

export default function PaymentPage({ params }: PaymentPageProps) {
    const { groupId } = params;
    const report = getReportByGroupId(groupId);
    
    if (!report) {
        notFound();
    }

    return (
        <DashboardLayoutShell>
            <PaymentPageContent initialReport={report} />
        </DashboardLayoutShell>
    );
}
