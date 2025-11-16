
import { NextResponse } from 'next/server';
import { addReport, reports } from '../data';

export async function GET(request: Request) {
  // In a real app, you'd fetch this from a database
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  // We reverse to show the latest reports first
  const reversedReports = [...reports].reverse();

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedReports = reversedReports.slice(startIndex, endIndex);

  return NextResponse.json({ 
    reports: paginatedReports,
    total: reports.length,
    hasMore: endIndex < reports.length,
  });
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In a real app, you'd save this to a database
    const newReport = addReport(body);
    console.log('Saved Report:', JSON.stringify(newReport, null, 2));
    return NextResponse.json({ message: 'Report saved successfully', report: newReport }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error saving report', error: (error as Error).message }, { status: 500 });
  }
}
