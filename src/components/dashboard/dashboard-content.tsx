"use client";

import { Suspense } from 'react';
import useSWR from 'swr';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { PaymentChart } from '@/components/dashboard/payment-chart';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function DashboardContent() {
    const { data: statsData, error: statsError, isLoading: isLoadingStats } = useSWR('/api/stats', fetcher);
    const { data: reportsData, error: reportsError, isLoading: isLoadingReports } = useSWR('/api/reports?page=1&limit=5', fetcher);

    if (isLoadingStats || isLoadingReports) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <Suspense fallback={<StatsCards.Skeleton />}>
                <StatsCards stats={statsData} />
            </Suspense>
            
            <div className="grid gap-6 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <Suspense fallback={<PaymentChart.Skeleton />}>
                        <PaymentChart />
                    </Suspense>
                </div>

                <div className="lg:col-span-3">
                    <Suspense fallback={<RecentReports.Skeleton />}>
                        <RecentReports reports={reportsData?.reports || []} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
