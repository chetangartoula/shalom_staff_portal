
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatsCards } from '@/components/stats-cards';
import { RecentReports } from '@/components/recent-reports';
import { getStats, getPaginatedReports } from '@/app/api/data';

export default async function DashboardPage() {
    const stats = getStats();
    const { reports } = getPaginatedReports(1, 5);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <StatsCards stats={stats} />
                <RecentReports reports={reports} />
            </div>
        </DashboardLayout>
    );
}
