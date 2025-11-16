
import { ReportsContent } from '@/components/reports-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getPaginatedReports } from '../api/data';

export default async function ReportsPage() {
  const initialReports = await getPaginatedReports(1, 10);
  return (
    <DashboardLayoutShell>
      <ReportsContent initialData={initialReports} />
    </DashboardLayoutShell>
  );
}
