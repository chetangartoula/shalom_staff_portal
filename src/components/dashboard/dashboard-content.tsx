
"use client";

import { Suspense, lazy } from 'react';
import useSWR from 'swr';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const TrekPopularityChart = lazy(() => import('./trek-popularity-chart').then(module => ({ default: module.TrekPopularityChart })));
const TeamAvailabilityChart = lazy(() => import('./team-availability-chart').then(module => ({ default: module.TeamAvailabilityChart })));
const PaymentChart = lazy(() => import('./payment-chart').then(module => ({ default: module.PaymentChart })));

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
            <StatsCards stats={statsData} />
            
             <div className="grid gap-6 md:grid-cols-2">
                <Suspense fallback={<TrekPopularityChart.Skeleton />}>
                    <TrekPopularityChart />
                </Suspense>
                <Suspense fallback={<TeamAvailabilityChart.Skeleton />}>
                    <TeamAvailabilityChart />
                </Suspense>
            </div>
            
            <RecentReports reports={reportsData?.reports || []} />
            
            <Suspense fallback={<PaymentChart.Skeleton />}>
                <PaymentChart />
            </Suspense>
        </div>
    );
}
