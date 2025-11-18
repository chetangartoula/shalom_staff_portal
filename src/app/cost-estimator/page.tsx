
import { TrekCostingPage } from "@/components/dashboard/trek-costing-page";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getTreks } from '@/app/api/data';
import { getUser } from '@/lib/auth';
import type { Trek } from "@/lib/types";

export default async function NewCostReportPage() {
  const { treks }: { treks: Trek[] } = getTreks();
  const user = await getUser();
  
  return (
    <DashboardLayout user={user}>
      <TrekCostingPage treks={treks} user={user} />
    </DashboardLayout>
  );
}
