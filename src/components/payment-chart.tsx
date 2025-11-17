
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const chartConfig = {
    payments: {
        label: "Payments",
        color: "hsl(var(--chart-2))",
    },
    refunds: {
        label: "Refunds",
        color: "hsl(var(--chart-5))",
    },
};

export function PaymentChart() {
    const { data, error, isLoading } = useSWR('/api/stats/payments', fetcher);

    if (isLoading) {
        return <PaymentChart.Skeleton />;
    }

    if (error || !data?.chartData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Payment Analytics</CardTitle>
                    <CardDescription>Last 30 Days</CardDescription>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                    <p className="text-destructive">Could not load payment data.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>Last 30 Days</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={data.chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis
                            tickFormatter={(value) => formatCurrency(Number(value))}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent
                                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                formatter={(value, name) => `${formatCurrency(Number(value))}`}
                            />}
                        />
                        <Bar dataKey="payments" fill="var(--color-payments)" radius={4} />
                        <Bar dataKey="refunds" fill="var(--color-refunds)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

PaymentChart.Skeleton = function PaymentChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>Last 30 Days</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
};
