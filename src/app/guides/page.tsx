
import { GuidesContent } from '@/components/dashboard/guides-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getGuides } from '../api/data';
import { getUser } from '@/lib/auth';

export default async function GuidesPage() {
  const { guides } = getGuides();
  const user = await getUser();

  return (
    <DashboardLayout user={user}>
      <GuidesContent initialData={guides} />
    </DashboardLayout>
  );
}
