
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatsCards } from '@/components/stats-cards';
import { RecentReports } from '@/components/recent-reports';

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                <Suspense fallback={<StatsCards.Skeleton />}>
                    {/* @ts-expect-error Server Component */}
                    <StatsCards />
                </Suspense>
                <Suspense fallback={<RecentReports.Skeleton />}>
                    {/* @ts-expect-error Server Component */}
                    <RecentReports />
                </Suspense>
            </div>
        </DashboardLayout>
    );
}
