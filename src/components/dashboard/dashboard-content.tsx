
"use client";

import { Suspense, lazy, useState, useEffect } from 'react';
import useSWR from 'swr';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { Loader2 } from 'lucide-react';
import { TrekPopularityChart } from './trek-popularity-chart';
import { TeamAvailabilityChart } from './team-availability-chart';
import { PaymentChart } from './payment-chart';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Lazy load components
const LazyTrekPopularityChart = lazy(() => import('./trek-popularity-chart').then(module => ({ default: module.TrekPopularityChart })));
const LazyTeamAvailabilityChart = lazy(() => import('./team-availability-chart').then(module => ({ default: module.TeamAvailabilityChart })));
const LazyPaymentChart = lazy(() => import('./payment-chart').then(module => ({ default: module.PaymentChart })));

export function DashboardContent() {
    const { data: statsData, error: statsError, isLoading: isLoadingStats } = useSWR('/api/stats', fetcher);
    const { data: reportsData, error: reportsError, isLoading: isLoadingReports } = useSWR('/api/reports?page=1&limit=5', fetcher);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // This ensures the heavy components are only rendered on the client after initial mount.
        const timer = setTimeout(() => {
            setIsClient(true);
        }, 500); // A small delay to ensure critical content renders first
        return () => clearTimeout(timer);
    }, []);

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
                {isClient ? (
                    <Suspense fallback={<TrekPopularityChart.Skeleton />}>
                        <LazyTrekPopularityChart />
                    </Suspense>
                ) : (
                    <TrekPopularityChart.Skeleton />
                )}
                {isClient ? (
                    <Suspense fallback={<TeamAvailabilityChart.Skeleton />}>
                        <LazyTeamAvailabilityChart />
                    </Suspense>
                ) : (
                    <TeamAvailabilityChart.Skeleton />
                )}
            </div>
            
            {isLoadingReports ? <RecentReports.Skeleton /> : <RecentReports reports={reportsData?.reports || []} />}
            
            {isClient ? (
                <Suspense fallback={<PaymentChart.Skeleton />}>
                    <LazyPaymentChart />
                </Suspense>
            ) : (
                <PaymentChart.Skeleton />
            )}
        </div>
    );
}
