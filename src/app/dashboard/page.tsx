
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { getStats, getPaginatedReports } from '@/app/api/data';
import { getUser } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard-content';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const user = await getUser();
    const stats = getStats();
    const initialReportsData = getPaginatedReports(1, 5);

    return (
        <DashboardLayout user={user}>
            <DashboardContent initialStats={stats} initialReports={initialReportsData.reports} />
        </DashboardLayout>
    );
}
