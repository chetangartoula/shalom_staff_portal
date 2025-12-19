"use client";

import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { ChartTooltip, ChartTooltipContent } from '@/components/ui/shadcn/chart';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const chartConfig = {
    payments: {
        label: "Payments",
        color: "hsl(var(--primary))",
    },
    refunds: {
        label: "Refunds",
        color: "hsl(var(--destructive))",
    },
};

export function PaymentChart() {
    // Use React Query to fetch payment data
    const { data, error, isLoading } = useQuery({
        queryKey: ['paymentAnalytics'],
        queryFn: async () => {
            try {
                const response = await fetch('/api/stats/payments');
                if (!response.ok) {
                    throw new Error('Failed to fetch payment data');
                }
                return response.json();
            } catch (error) {
                console.error('Error fetching payment data:', error);
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2
    });

    if (isLoading) {
        return <PaymentChartSkeleton />;
    }
    
    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Payment Analytics</CardTitle>
                    <CardDescription>Last 30 Days</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
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
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={data?.chartData}
                        margin={{
                            top: 5,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={12}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={12}
                            tickFormatter={(value) => {
                                if (typeof value !== 'number') return '';
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    notation: 'compact',
                                    compactDisplay: 'short'
                                }).format(value);
                            }}
                         />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent
                                labelFormatter={(label) => label}
                                formatter={(value) => `${formatCurrency(Number(value))}`}
                            />}
                        />
                        <Line
                            dataKey="payments"
                            type="monotone"
                            stroke={chartConfig.payments.color}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="refunds"
                            type="monotone"
                            stroke={chartConfig.refunds.color}
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function PaymentChartSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="space-y-2">
                    <div className="h-5 w-40 bg-muted rounded-md animate-pulse"></div>
                    <div className="h-4 w-24 bg-muted rounded-md animate-pulse"></div>
                </div>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
};