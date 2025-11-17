
import { ReportsContent } from '@/components/reports-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';

// Force dynamic rendering to ensure fresh data on each load
export const dynamic = 'force-dynamic';

export default function PaymentsPage() {
  // initialReports are no longer fetched on the server.
  // The ReportsContent component will now fetch its own data on the client.
  return (
    <DashboardLayoutShell>
      <ReportsContent pageType="payments" />
    </DashboardLayoutShell>
  );
}
