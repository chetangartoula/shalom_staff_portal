"use client";

import { useQuery } from '@tanstack/react-query';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentReports } from '@/components/dashboard/recent-reports';
import { Loader2 } from 'lucide-react';
import { TrekPopularityChart } from './trek-popularity-chart';
import { TeamAvailabilityChart } from './team-availability-chart';
import { PaymentChart } from './payment-chart';
import { fetchDashboardStats } from '@/lib/api-service';

export function DashboardContent() {
    // Use React Query for fetching all dashboard data from single endpoint
    const { data: dashboardData, error, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: fetchDashboardStats,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-destructive">Failed to load dashboard data. Please try again.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <StatsCards stats={dashboardData?.stats ?? null} />

            <div className="grid gap-6 md:grid-cols-2">
                <TrekPopularityChart data={dashboardData?.trekPopularity} />
                <TeamAvailabilityChart data={dashboardData?.teamAvailability} />
            </div>

            <RecentReports reports={dashboardData?.recentReports?.reports || []} />

            <PaymentChart data={dashboardData?.paymentAnalytics} />
        </div>
    );
}