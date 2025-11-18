
import { ReportsContent } from '@/components/dashboard/reports-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';

// Force dynamic rendering to ensure fresh data on each load
export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const user = await getUser();
  // initialReports are no longer fetched on the server.
  // The ReportsContent component will now fetch its own data on the client.
  return (
    <DashboardLayout user={user}>
      <ReportsContent pageType="payments" />
    </DashboardLayout>
  );
}
