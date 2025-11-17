
import { AssignmentsContent } from '@/components/assignments-content';
import { DashboardLayoutShell } from '@/components/dashboard-layout-shell';
import { getAllAssignmentsWithDetails } from '../api/data';

export default async function AssignmentsPage() {
    const assignments = await getAllAssignmentsWithDetails();
    return (
        <DashboardLayoutShell>
            <AssignmentsContent initialData={assignments} />
        </DashboardLayoutShell>
    );
}
