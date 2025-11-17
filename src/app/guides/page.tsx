
import { GuidesContent } from '@/components/guides-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getGuides } from '../api/data';

export default async function GuidesPage() {
  const { guides } = getGuides();
  return (
    <DashboardLayoutShell>
      <GuidesContent initialData={guides} />
    </DashboardLayoutShell>
  );
}
