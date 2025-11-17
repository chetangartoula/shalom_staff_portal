
"use client";

import { Suspense } from 'react';
import { StatsCards } from '@/components/stats-cards';
import { RecentReports } from '@/components/recent-reports';
import { PaymentChart } from '@/components/payment-chart';

export function DashboardContent({ initialStats, initialReports }: { initialStats: any, initialReports: any[] }) {
    return (
        <div className="space-y-8">
            <Suspense fallback={<StatsCards.Skeleton />}>
                <StatsCards stats={initialStats} />
            </Suspense>
            
            <Suspense fallback={<PaymentChart.Skeleton />}>
                <PaymentChart />
            </Suspense>

            <Suspense fallback={<RecentReports.Skeleton />}>
                <RecentReports reports={initialReports} />
            </Suspense>
        </div>
    );
}
