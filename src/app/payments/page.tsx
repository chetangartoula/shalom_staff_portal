
import { ReportsContent } from '@/components/reports-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getPaginatedReports } from '../api/data';

// Force dynamic rendering to ensure fresh data on each load
export const dynamic = 'force-dynamic';

export default function PaymentsPage() {
  const initialReports = getPaginatedReports(1, 10);
  return (
    <DashboardLayoutShell>
      <ReportsContent initialData={initialReports} pageType="payments" />
    </DashboardLayoutShell>
  );
}
