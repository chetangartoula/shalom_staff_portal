
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatsCards } from '@/components/stats-cards';
import { RecentReports } from '@/components/recent-reports';
import { getStats, getPaginatedReports } from '@/app/api/data';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const user = await getUser();
    const stats = getStats();
    const { reports } = getPaginatedReports(1, 5);

    return (
        <DashboardLayout user={user}>
            <div className="space-y-8">
                <Suspense fallback={<StatsCards.Skeleton />}>
                    <StatsCards stats={stats} />
                </Suspense>
                <Suspense fallback={<RecentReports.Skeleton />}>
                    <RecentReports reports={reports} />
                </Suspense>
            </div>
        </DashboardLayout>
    );
}
