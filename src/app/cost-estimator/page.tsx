
import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getTreks } from '@/app/api/data';
import { getUser } from '@/lib/auth';
import type { Trek } from "@/lib/types";

export default async function NewCostReportPage() {
  const { treks }: { treks: Trek[] } = getTreks();
  const user = await getUser();
  
  return (
    <DashboardLayoutShell>
      <TrekCostingPage treks={treks} user={user} />
    </DashboardLayoutShell>
  );
}
