
import { TravelersContent } from '@/components/dashboard/travelers-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';

export default async function TravelersPage() {
  const user = await getUser();
  return (
    <DashboardLayout user={user}>
      <TravelersContent />
    </DashboardLayout>
  );
}
