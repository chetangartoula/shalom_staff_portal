import { ClientCostEstimatorWithData } from '@/components/cost-estimator/client-component';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getTreks } from '@/app/api/data';
import { getUser } from '@/lib/auth';
import type { Trek } from "@/lib/types";




export default async function NewCostReportPage() {
  // Get initial treks data for fallback/loading states
  const { treks }: { treks: Trek[] } = getTreks();
  const user = await getUser();
  
  return (
    <DashboardLayout user={user}>
      <ClientCostEstimatorWithData initialTreks={treks} user={user} />
    </DashboardLayout>
  );
}