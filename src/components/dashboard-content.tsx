
"use client";

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Users, Mountain, Settings, Loader2, Edit } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  reports: number;
  travelers: number;
  treks: number;
  services: number;
}

interface RecentReport {
    groupId: string;
    trekName: string;
    groupSize: number;
    startDate: string;
}

export function DashboardContent() {
    const { toast } = useToast();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [reportsRes, travelersRes, treksRes, servicesRes] = await Promise.all([
                fetch('/api/reports?page=1&limit=5'),
                fetch('/api/travelers/all'),
                fetch('/api/treks'),
                fetch('/api/services')
            ]);

            if (!reportsRes.ok || !travelersRes.ok || !treksRes.ok || !servicesRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const reportsData = await reportsRes.json();
            const travelersData = await travelersRes.json();
            const treksData = await treksRes.json();
            const servicesData = await servicesRes.json();
            
            setStats({
                reports: reportsData.total,
                travelers: travelersData.travelers.length,
                treks: treksData.treks.length,
                services: servicesData.total,
            });
            
            setRecentReports(reportsData.reports);

        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load dashboard data. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const statCards = [
        { title: 'Total Reports', value: stats?.reports, icon: ClipboardList, color: 'text-blue-500' },
        { title: 'Total Travelers', value: stats?.travelers, icon: Users, color: 'text-green-500' },
        { title: 'Available Treks', value: stats?.treks, icon: Mountain, color: 'text-purple-500' },
        { title: 'Available Services', value: stats?.services, icon: Settings, color: 'text-orange-500' },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card, index) => (
                    <Card key={index} className="shadow-sm hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value ?? <Loader2 className="h-6 w-6 animate-spin" />}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Trek Name</TableHead>
                                <TableHead>Group ID</TableHead>
                                <TableHead>Group Size</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentReports.length > 0 ? recentReports.map((report) => (
                                <TableRow key={report.groupId}>
                                    <TableCell className="font-medium">{report.trekName}</TableCell>
                                    <TableCell>{report.groupId.substring(0, 8)}...</TableCell>
                                    <TableCell>{report.groupSize}</TableCell>
                                    <TableCell>{report.startDate ? format(new Date(report.startDate), 'PPP') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/cost-matrix/${report.groupId}`}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No recent reports found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
