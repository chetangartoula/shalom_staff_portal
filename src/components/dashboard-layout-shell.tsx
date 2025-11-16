
import { DashboardLayout } from '@/components/dashboard-layout';
import { getUser } from '@/lib/auth';

interface DashboardLayoutShellProps {
    children: React.ReactNode;
}

export async function DashboardLayoutShell({ children }: DashboardLayoutShellProps) {
    const user = await getUser();
    return (
        <DashboardLayout user={user}>
            {children}
        </DashboardLayout>
    );
}
