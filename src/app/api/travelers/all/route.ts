import { NextResponse } from 'next/server';
import { travelers, reports } from '../../data';

// Create a map for quick report lookup
const reportMap = new Map(reports.map(r => [r.groupId, r]));

export async function GET() {
  try {
    // Flatten the traveler data and enrich it with trekName from reports
    const allTravelers = travelers.flatMap(group => {
      const report = reportMap.get(group.groupId);
      return group.travelers.map((traveler: any) => ({
        ...traveler,
        groupId: group.groupId,
        trekName: report ? report.trekName : 'N/A', // Add trek name
      }));
    });

    return NextResponse.json({ travelers: allTravelers });
  } catch (error) {
    console.error("Error fetching all travelers:", error);
    return NextResponse.json({ message: 'Error fetching travelers', error: (error as Error).message }, { status: 500 });
  }
}
