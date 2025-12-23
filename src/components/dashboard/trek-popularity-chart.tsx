"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/shadcn/chart';
import { Loader2 } from 'lucide-react';

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
];

interface TrekPopularityChartProps {
    data?: {
        chartData: Array<{ name: string; value: number }>;
    };
}

export function TrekPopularityChart({ data }: TrekPopularityChartProps) {
    const chartData = data?.chartData || [];

    if (chartData.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Trek Popularity</CardTitle>
                    <CardDescription>Distribution of trips across different treks.</CardDescription>
                </CardHeader>
                <CardContent className="h-[240px] flex items-center justify-center">
                    <p className="text-muted-foreground">No trip data available.</p>
                </CardContent>
            </Card>
        );
    }

    const totalValue = chartData.reduce((acc: number, entry: any) => acc + entry.value, 0);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Trek Popularity</CardTitle>
                <CardDescription>Distribution of trips across different treks.</CardDescription>
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
                                dataKey="value"
                                nameKey="name"
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={<ChartTooltipContent
                                    formatter={(value) => `${value} trips`}
                                />}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 text-sm">
                        {chartData.map((entry: any, index: number) => {
                            const percentage = totalValue > 0 ? (entry.value / totalValue * 100).toFixed(0) : 0;
                            return (
                                <div key={entry.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="truncate max-w-[120px]">{entry.name}</span>
                                    </div>
                                    <span className="font-semibold">{percentage}%</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function TrekPopularityChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-4 w-48 bg-muted rounded-md animate-pulse"></div>
                </div>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[180px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
};