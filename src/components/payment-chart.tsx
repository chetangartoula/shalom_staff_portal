
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                    <LineChart
                        accessibilityLayer
                        data={data.chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => formatCurrency(Number(value)).slice(0,-3)}
                         />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent
                                labelFormatter={(label, payload) => {
                                    const datePoint = payload?.[0]?.payload;
                                    return datePoint?.date ? format(new Date(datePoint.date), "PPP") : label;
                                }}
                                formatter={(value, name) => `${formatCurrency(Number(value))}`}
                            />}
                        />
                        <Line
                            dataKey="payments"
                            type="monotone"
                            stroke="var(--color-payments)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            dataKey="refunds"
                            type="monotone"
                            stroke="var(--color-refunds)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
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
            <CardContent className="flex justify-center items-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
};
