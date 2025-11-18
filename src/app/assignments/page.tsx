
import { AssignmentsContent } from '@/components/dashboard/assignments-content';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
    const user = await getUser();
    
    return (
        <DashboardLayout user={user}>
            <AssignmentsContent />
        </DashboardLayout>
    );
}
