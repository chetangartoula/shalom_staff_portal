
import { NextResponse } from 'next/server';
import { getAllTransactions } from '../../data';
import { subDays, format, parseISO } from 'date-fns';

export async function GET() {
    try {
        const allTransactions = getAllTransactions();
        const thirtyDaysAgo = subDays(new Date(), 30);

        // Filter transactions for the last 30 days
        const recentTransactions = allTransactions.filter(t => parseISO(t.date) >= thirtyDaysAgo);

        // Aggregate data by day
        const aggregatedData: { [key: string]: { date: string; payments: number; refunds: number } } = {};

        recentTransactions.forEach(t => {
            const date = format(parseISO(t.date), 'yyyy-MM-dd');
            if (!aggregatedData[date]) {
                aggregatedData[date] = { date, payments: 0, refunds: 0 };
            }
            if (t.type === 'payment') {
                aggregatedData[date].payments += t.amount;
            } else {
                aggregatedData[date].refunds += t.amount;
            }
        });

        // Create a date range for the last 30 days to fill in gaps
        const chartData = [];
        for (let i = 0; i < 30; i++) {
            const dateObj = subDays(new Date(), i);
            const formattedDate = format(dateObj, 'yyyy-MM-dd');
            const dayData = aggregatedData[formattedDate] || { date: formattedDate, payments: 0, refunds: 0 };
            chartData.push({
                ...dayData,
                date: format(dateObj, 'MMM d') // Format for chart display
            });
        }

        return NextResponse.json({ chartData: chartData.reverse() });

    } catch (error) {
        return NextResponse.json({ message: 'Error fetching payment stats', error: (error as Error).message }, { status: 500 });
    }
}
