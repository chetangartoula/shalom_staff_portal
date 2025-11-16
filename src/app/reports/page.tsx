import { ReportsContent } from '@/components/reports-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';

async function getReports() {
  // Using 'no-store' to ensure the latest reports are always fetched.
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reports?page=1&limit=10`, { cache: 'no-store' });
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch reports');
  }
  return res.json();
}

export default async function ReportsPage() {
  // Data is fetched on the server
  const initialReportsData = await getReports();

  return (
    <DashboardLayoutShell>
      {/* Pass server-fetched data to the client component */}
      <ReportsContent initialData={initialReportsData} />
    </DashboardLayoutShell>
  );
}
