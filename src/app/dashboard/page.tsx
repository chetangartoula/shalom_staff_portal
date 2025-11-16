
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatsCards } from '@/components/stats-cards';
import { RecentReports } from '@/components/recent-reports';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, reportsRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/reports?page=1&limit=5')
                ]);

                if (!statsRes.ok || !reportsRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const statsData = await statsRes.json();
                const reportsData = await reportsRes.json();

                setStats(statsData);
                setReports(reportsData.reports);
            } catch (error) {
                console.error(error);
                // Optionally set an error state and show a message
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {isLoading ? (
                    <>
                        <StatsCards.Skeleton />
                        <RecentReports.Skeleton />
                    </>
                ) : (
                    <>
                        {stats && <StatsCards stats={stats} />}
                        {reports && <RecentReports reports={reports} />}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
