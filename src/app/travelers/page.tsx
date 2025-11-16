import { TravelersContent } from '@/components/travelers-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getAllTravelers } from '@/app/api/travelers/all/route';


export default async function TravelersPage() {
  // Data is fetched on the server by calling the function directly
  const initialTravelersData = await getAllTravelers();

  return (
    <DashboardLayoutShell>
      {/* Pass server-fetched data to the client component */}
      <TravelersContent initialData={initialTravelersData} />
    </DashboardLayoutShell>
  );
}
