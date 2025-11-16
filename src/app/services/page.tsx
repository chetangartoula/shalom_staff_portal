import { ServicesContent } from '@/components/services-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';

async function getServices() {
  // Use Next.js fetch with caching and revalidation
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/services`, { next: { revalidate: 3600 } }); // Cache for 1 hour
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch services');
  }
  return res.json();
}

export default async function ServicesPage() {
  // Data is fetched on the server
  const initialServicesData = await getServices();

  return (
    <DashboardLayoutShell>
      {/* Pass server-fetched data to the client component */}
      <ServicesContent initialData={initialServicesData} />
    </DashboardLayoutShell>
  );
}
