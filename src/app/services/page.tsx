
import { ServicesContent } from '@/components/services-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getPaginatedServices } from '../api/data';

export default async function ServicesPage() {
  const initialServices = getPaginatedServices(1, 10);
  return (
    <DashboardLayoutShell>
      <ServicesContent initialData={initialServices}/>
    </DashboardLayoutShell>
  );
}
