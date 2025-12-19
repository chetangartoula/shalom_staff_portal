import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { Trek } from "@/lib/types";
import { ClientCostEstimator } from '@/components/cost-estimator/client-component';
import { initialTreks } from '@/lib/mock-data';

interface User {
  name: string;
  email: string;
  role: string;
}

// Mock user data to pass to client component
const mockUser: User = {
  name: 'Admin User',
  email: 'admin@shalom.com',
  role: 'Admin',
};

export default function NewCostReportPage() {
  return (
    <DashboardLayout user={mockUser}>
      <ClientCostEstimator initialTreks={initialTreks} user={mockUser} />
    </DashboardLayout>
  );
}