
import { TravelersContent } from '@/components/travelers-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getAllTravelers } from '@/app/api/data';

export default async function TravelersPage() {
  const { travelers } = await getAllTravelers();
  return (
    <DashboardLayoutShell>
      <TravelersContent initialData={travelers} />
    </DashboardLayoutShell>
  );
}
