import { ServicesContent } from '@/components/services-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getPaginatedServices } from '@/app/api/services/route';


export default async function ServicesPage() {
  // Data is fetched on the server by calling the function directly
  const initialServicesData = await getPaginatedServices(1, 10);

  return (
    <DashboardLayoutShell>
      {/* Pass server-fetched data to the client component */}
      <ServicesContent initialData={initialServicesData} />
    </DashboardLayoutShell>
  );
}
