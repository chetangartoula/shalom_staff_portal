"use client";

import { Suspense } from 'react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { PaymentChart } from '@/components/dashboard/payment-chart';

export function DashboardContent({ initialStats, initialReports }: { initialStats: any, initialReports: any[] }) {
    return (
        <div className="space-y-6">
            <Suspense fallback={<StatsCards.Skeleton />}>
                <StatsCards stats={initialStats} />
            </Suspense>
            
            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <Suspense fallback={<PaymentChart.Skeleton />}>
                        <PaymentChart />
                    </Suspense>
                </div>

                <div className="lg:col-span-3">
                    <Suspense fallback={<RecentReports.Skeleton />}>
                        <RecentReports reports={initialReports} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
