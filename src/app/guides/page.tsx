
import { GuidesContent } from '@/components/dashboard/guides-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';

export default async function GuidesPage() {
  const user = await getUser();

  return (
    <DashboardLayout user={user}>
      <GuidesContent />
    </DashboardLayout>
  );
}
