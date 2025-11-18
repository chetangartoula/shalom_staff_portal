
import { PortersContent } from '@/components/dashboard/porters-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';

export default async function PortersPage() {
  const user = await getUser();
  return (
    <DashboardLayout user={user}>
      <PortersContent />
    </DashboardLayout>
  );
}
