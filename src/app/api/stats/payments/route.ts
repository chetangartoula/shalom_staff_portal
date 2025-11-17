
import { NextResponse } from 'next/server';
import { getAllTransactions } from '../../data';
import { subDays, format, parseISO, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

export async function GET() {
    try {
        const allTransactions = getAllTransactions();
        
        // Define the 30-day interval including today
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(new Date(), 29));

        // Create a map to hold aggregated data for each day in the interval
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        const aggregatedData = new Map<string, { date: string, payments: number, refunds: number }>();
        dateRange.forEach(date => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            aggregatedData.set(formattedDate, {
                date: format(date, 'MMM d'), // Format for chart display
                payments: 0,
                refunds: 0
            });
        });

        // Filter transactions that fall within the last 30 days
        const recentTransactions = allTransactions.filter(t => {
            const transactionDate = parseISO(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        // Process the filtered transactions
        recentTransactions.forEach(t => {
            const dateKey = format(parseISO(t.date), 'yyyy-MM-dd');
            const dayData = aggregatedData.get(dateKey);

            if (dayData) {
                if (t.type === 'payment') {
                    dayData.payments += t.amount;
                } else {
                    dayData.refunds += t.amount;
                }
            }
        });

        // Convert the map to an array for the chart
        const chartData = Array.from(aggregatedData.values());

        return NextResponse.json({ chartData });

    } catch (error) {
        console.error("Error fetching payment stats:", error);
        return NextResponse.json({ message: 'Error fetching payment stats', error: (error as Error).message }, { status: 500 });
    }
}
