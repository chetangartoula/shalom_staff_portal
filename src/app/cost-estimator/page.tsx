
import { TrekCostingPage } from "@/app/cost-matrix-page";
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';

export default function NewCostReportPage() {
  return (
    <DashboardLayoutShell>
      <TrekCostingPage />
    </DashboardLayoutShell>
  );
}
