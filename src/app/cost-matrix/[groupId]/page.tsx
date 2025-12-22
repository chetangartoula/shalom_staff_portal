
import { TrekCostingPage } from "@/components/dashboard/trek-costing-page";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { notFound } from "next/navigation";
import { getTreks } from "@/app/api/data";
import { getUser } from "@/lib/auth";
import { fetchGroupAndPackageById } from "@/lib/api-service";
import type { Trek } from "@/lib/types";

interface EditCostMatrixPageProps {
  params: {
    groupId: string;
  };
}

export default async function EditCostMatrixPage({ params }: EditCostMatrixPageProps) {
    const { groupId } = await params; // Await the params object
    
    // Fetch data from the real API instead of local mock data
    let initialData = null;
    try {
        initialData = await fetchGroupAndPackageById(groupId);
    } catch (error) {
        console.error('Error fetching group data:', error);
        // If API fetch fails, fall back to local data
        // This maintains backward compatibility
    }
    
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
