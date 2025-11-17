
import { TransactionsContent } from '@/components/transactions-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';

// Force dynamic rendering to ensure fresh data on each load
export const dynamic = 'force-dynamic';

export default function TransactionsPage() {
  return (
    <DashboardLayoutShell>
      <TransactionsContent />
    </DashboardLayoutShell>
  );
}

    