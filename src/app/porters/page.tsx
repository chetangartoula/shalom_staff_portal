
import { PortersContent } from '@/components/porters-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getPorters } from '../api/data';

export default async function PortersPage() {
  const { porters } = getPorters();
  return (
    <DashboardLayoutShell>
      <PortersContent initialData={porters} />
    </DashboardLayoutShell>
  );
}
