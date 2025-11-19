import { AirportPickUpContent } from '@/components/dashboard/airport-pick-up-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';

export default async function AirportPickUpPage() {
  const user = await getUser();
  return (
    <DashboardLayout user={user}>
      <AirportPickUpContent />
    </DashboardLayout>
  );
}