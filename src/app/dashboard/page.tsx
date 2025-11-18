
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const user = await getUser();

    return (
        <DashboardLayout user={user}>
            <DashboardContent />
        </DashboardLayout>
    );
}
