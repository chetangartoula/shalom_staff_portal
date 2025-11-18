
import { NextResponse } from 'next/server';
import { getGuides, getPorters } from '../../data';

export async function GET() {
    try {
        const { guides } = getGuides();
        const { porters } = getPorters();

        const guideStatusCounts = guides.reduce((acc, guide) => {
            acc[guide.status] = (acc[guide.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const porterStatusCounts = porters.reduce((acc, porter) => {
            // Normalize 'On Trek' to 'On Tour' to combine them
            const status = porter.status === 'On Trek' ? 'On Tour' : porter.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Combine guide and porter statuses
        const combinedStatusCounts = { ...guideStatusCounts };
        for (const status in porterStatusCounts) {
            combinedStatusCounts[status] = (combinedStatusCounts[status] || 0) + porterStatusCounts[status];
        }
        
        const chartData = Object.entries(combinedStatusCounts).map(([name, value]) => ({
            name,
            value,
        }));

        return NextResponse.json({ chartData });

    } catch (error) {
        console.error("Error fetching team status:", error);
        return NextResponse.json({ message: 'Error fetching team status', error: (error as Error).message }, { status: 500 });
    }
}
