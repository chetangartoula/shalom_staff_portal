
"use client";

import useSWR from 'swr';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/shadcn/chart';
import { Loader2 } from 'lucide-react';
import { Badge } from '../ui/shadcn/badge';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const statusColors: Record<string, {tw: string, hex: string}> = {
    Available: { tw: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400", hex: "#22c55e" },
    'On Tour': { tw: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400", hex: "#3b82f6" },
    'On Leave': { tw: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400", hex: "#eab308"},
};


export function TeamAvailabilityChart() {
    const { data, error, isLoading } = useSWR('/api/stats/team-status', fetcher);

    const chartData = data?.chartData || [];

    if (isLoading) {
        return <TeamAvailabilityChart.Skeleton />;
    }

    if (error || chartData.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Team Availability</CardTitle>
                    <CardDescription>Current status of all guides and porters.</CardDescription>
                </CardHeader>
                <CardContent className="h-[240px] flex items-center justify-center">
                    <p className="text-muted-foreground">{error ? "Could not load data." : "No data available."}</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Team Availability</CardTitle>
                <CardDescription>Current status of all guides and porters.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 items-center">
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                innerRadius={60}
                                dataKey="value"
                                nameKey="name"
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={statusColors[entry.name]?.hex || '#8884d8'} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={<ChartTooltipContent
                                    formatter={(value, name) => `${value} team members`}
                                />}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 text-sm">
                        {chartData.map((entry: any) => (
                             <div key={entry.name} className="flex items-center justify-between">
                                <Badge variant="outline" className={cn("capitalize font-normal", statusColors[entry.name]?.tw)}>
                                    {entry.name}
                                </Badge>
                                <span className="font-semibold">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

TeamAvailabilityChart.Skeleton = function TeamAvailabilityChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="space-y-2">
                    <div className="h-5 w-40 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-4 w-48 bg-muted rounded-md animate-pulse"></div>
                </div>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[180px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
};
