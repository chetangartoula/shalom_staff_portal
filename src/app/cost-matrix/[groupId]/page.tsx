
import { TrekCostingPage } from "@/components/dashboard/trek-costing-page";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { notFound } from "next/navigation";
import { getReportByGroupId, getTreks } from "@/app/api/data";
import { getUser } from "@/lib/auth";
import type { Trek } from "@/lib/types";

interface EditCostMatrixPageProps {
  params: {
    groupId: string;
  };
}

export default async function EditCostMatrixPage({ params }: EditCostMatrixPageProps) {
    const { groupId } = await params; // Await the params object
    const initialData = getReportByGroupId(groupId);
    const { treks }: { treks: Trek[] } = getTreks();
    const user = await getUser();

    if (!initialData) {
        notFound();
    }

    return (
        <DashboardLayout user={user}>
            <TrekCostingPage initialData={initialData} treks={treks} user={user} />
        </DashboardLayout>
    );
}
