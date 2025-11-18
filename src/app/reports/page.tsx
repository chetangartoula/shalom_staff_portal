
import { ReportsContent } from '@/components/dashboard/reports-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getPaginatedReports } from '../api/data';
import { getUser } from '@/lib/auth';

// Force dynamic rendering to ensure fresh data on each load
export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const initialReports = getPaginatedReports(1, 10);
  const user = await getUser();
  return (
    <DashboardLayout user={user}>
      <ReportsContent initialData={initialReports} pageType="reports" />
    </DashboardLayout>
  );
}
