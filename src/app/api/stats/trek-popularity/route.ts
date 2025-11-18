
import { NextResponse } from 'next/server';
import { getAllReports } from '../../data';
import type { Report } from '@/lib/types';

export async function GET() {
    try {
        const reports: Report[] = getAllReports();

        if (!reports || reports.length === 0) {
            return NextResponse.json({ chartData: [] });
        }
        
        const trekCounts = reports.reduce((acc, report) => {
            const trekName = report.trekName || 'Unknown Trek';
            acc[trekName] = (acc[trekName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(trekCounts).map(([name, value]) => ({
            name,
            value,
        }));

        return NextResponse.json({ chartData });

    } catch (error) {
        console.error("Error fetching trek popularity:", error);
        return NextResponse.json({ message: 'Error fetching trek popularity stats', error: (error as Error).message }, { status: 500 });
    }
}
