"use client";

import { Suspense } from 'react';
import { StatsCards } from './stats-cards';
import { RecentReports } from './recent-reports';


export function DashboardContent() {
    return (
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
    );
}
