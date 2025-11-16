
import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from "@/components/dashboard-layout-shell";
import { notFound } from "next/navigation";
import { getReportByGroupId, getTreks } from "@/app/api/data";
import type { Trek } from "@/lib/types";

interface EditCostMatrixPageProps {
  params: {
    groupId: string;
  };
}

export default async function EditCostMatrixPage({ params }: EditCostMatrixPageProps) {
    const { groupId } = params;
    const initialData = getReportByGroupId(groupId);
    const { treks }: { treks: Trek[] } = getTreks();

    if (!initialData) {
        notFound();
    }

    return (
        <DashboardLayoutShell>
            <TrekCostingPage initialData={initialData} treks={treks} />
        </DashboardLayoutShell>
    );
}
