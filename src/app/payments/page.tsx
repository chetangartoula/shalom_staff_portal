
import { PaymentsContent } from '@/components/dashboard/payments-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';

// Force dynamic rendering to ensure fresh data on each load
export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const user = await getUser();
  return (
    <DashboardLayout user={user}>
      <PaymentsContent />
    </DashboardLayout>
  );
}
