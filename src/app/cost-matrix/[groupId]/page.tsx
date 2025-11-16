
import { getTreks } from "@/app/api/treks/route";
import { getReportByGroupId } from "@/app/api/reports/[groupId]/route";
import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from "@/components/dashboard-layout-shell";
import { notFound } from "next/navigation";

interface EditCostMatrixPageProps {
  params: {
    groupId: string;
  };
}

export default async function EditCostMatrixPage({ params }: EditCostMatrixPageProps) {
    const { groupId } = params;

    // Fetch treks and the specific report data in parallel on the server.
    const [treksData, reportData] = await Promise.all([
        getTreks(),
        getReportByGroupId(groupId)
    ]);

    if (!reportData) {
        // If the report doesn't exist, show a 404 page.
        notFound();
    }

    return (
        <DashboardLayoutShell>
            <TrekCostingPage treks={treksData.treks} initialData={reportData} />
        </DashboardLayoutShell>
    );
}
