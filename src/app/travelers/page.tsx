
import { TravelersContent } from '@/components/dashboard/travelers-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getAllTravelers } from '@/app/api/data';
import { getUser } from '@/lib/auth';

export default async function TravelersPage() {
  const { travelers } = await getAllTravelers();
  const user = await getUser();
  return (
    <DashboardLayout user={user}>
      <TravelersContent initialData={travelers} />
    </DashboardLayout>
  );
}
