import { TravelersContent } from '@/components/travelers-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';

async function getTravelers() {
  // Using 'no-store' to ensure the latest traveler data is always fetched.
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/travelers/all`, { cache: 'no-store' });
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch travelers');
  }
  return res.json();
}

export default async function TravelersPage() {
  // Data is fetched on the server
  const initialTravelersData = await getTravelers();

  return (
    <DashboardLayoutShell>
      {/* Pass server-fetched data to the client component */}
      <TravelersContent initialData={initialTravelersData} />
    </DashboardLayoutShell>
  );
}
