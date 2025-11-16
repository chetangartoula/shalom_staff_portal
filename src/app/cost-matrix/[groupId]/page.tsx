
import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from "@/components/dashboard-layout-shell";
import { notFound } from "next/navigation";
import { getReportByGroupId } from "@/app/api/data";

interface EditCostMatrixPageProps {
  params: {
    groupId: string;
  };
}

export default async function EditCostMatrixPage({ params }: EditCostMatrixPageProps) {
    const { groupId } = params;
    const initialData = getReportByGroupId(groupId);

    if (!initialData) {
        notFound();
    }

    return (
        <DashboardLayoutShell>
            <TrekCostingPage initialData={initialData} />
        </DashboardLayoutShell>
    );
}
