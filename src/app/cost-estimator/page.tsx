
import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getTreks } from '@/app/api/treks/route';
import type { Trek } from "@/lib/types";

export default async function NewCostReportPage() {
  // Fetch treks on the server
  const { treks }: { treks: Trek[] } = await getTreks();

  return (
    <DashboardLayoutShell>
      <TrekCostingPage treks={treks} />
    </DashboardLayoutShell>
  );
}
