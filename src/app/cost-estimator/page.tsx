import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getTreks } from '@/app/api/treks/route';
import type { Trek } from "@/lib/types";

export default async function NewCostReportPage() {
  // Fetch treks on the server
  const { treks }: { treks: Trek[] } = await getTreks();

  // The setTreks prop is no longer needed as data is fetched on the server
  // and is not expected to be mutable from the child component in this context.
  const setTreksStub = () => {};

  return (
    <DashboardLayoutShell>
      <TrekCostingPage treks={treks} setTreks={setTreksStub} />
    </DashboardLayoutShell>
  );
}
