
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatsCards } from '@/components/stats-cards';
import { RecentReports } from '@/components/recent-reports';
import { getStats, getPaginatedReports } from '@/app/api/data';
import { getUser } from '@/lib/auth';
import { PaymentChart } from '@/components/payment-chart';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const user = await getUser();
    const stats = getStats();
    
    // Fetch data that is critical and fast on the server
    const initialReportsData = getPaginatedReports(1, 5);

    return (
        <DashboardLayout user={user}>
            <div className="space-y-8">
                <Suspense fallback={<StatsCards.Skeleton />}>
                    {/* Assuming getStats is fast, but wrapping for consistency */}
                    <StatsCards stats={stats} />
                </Suspense>
                
                <Suspense fallback={<PaymentChart.Skeleton />}>
                    {/* PaymentChart fetches its own data client-side, so it needs Suspense */}
                    <PaymentChart />
                </Suspense>

                <Suspense fallback={<RecentReports.Skeleton />}>
                    {/* Pass server-fetched data to this component */}
                    <RecentReports reports={initialReportsData.reports} />
                </Suspense>
            </div>
        </DashboardLayout>
    );
}
