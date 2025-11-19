import { ComprehensiveReportsContent } from '@/components/dashboard/comprehensive-reports-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';

// Force dynamic rendering to ensure fresh data on each load
export const dynamic = 'force-dynamic';

export default async function ComprehensiveReportsPage() {
  const user = await getUser();
  return (
    <DashboardLayout user={user}>
      <ComprehensiveReportsContent />
    </DashboardLayout>
  );
}