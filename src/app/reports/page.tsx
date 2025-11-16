import { ReportsContent } from '@/components/reports-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getPaginatedReports } from '@/app/api/reports/route';

export default async function ReportsPage() {
  // Data is fetched on the server by calling the function directly
  const initialReportsData = await getPaginatedReports(1, 10);

  return (
    <DashboardLayoutShell>
      {/* Pass server-fetched data to the client component */}
      <ReportsContent initialData={initialReportsData} />
    </DashboardLayoutShell>
  );
}
