
import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getTreks } from '@/app/api/data';
import type { Trek } from "@/lib/types";

export default async function NewCostReportPage() {
  const { treks }: { treks: Trek[] } = getTreks();
  
  return (
    <DashboardLayoutShell>
      <TrekCostingPage treks={treks} />
    </DashboardLayoutShell>
  );
}
