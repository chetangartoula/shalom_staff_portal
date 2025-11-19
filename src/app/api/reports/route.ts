import { NextResponse } from 'next/server';
import { getPaginatedReports, addReport, getAllReports } from '../data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search');
  
  // If search parameter is provided, return filtered results
  if (search) {
    const allReports = getAllReports();
    const filteredReports = allReports.filter(report => 
      report.groupName.toLowerCase().includes(search.toLowerCase()) || 
      report.groupId.toLowerCase().includes(search.toLowerCase())
    );
    
    // Paginate the filtered results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);
    
    return NextResponse.json({
      reports: paginatedReports,
      total: filteredReports.length,
      hasMore: endIndex < filteredReports.length,
    });
  }
  
  const data = getPaginatedReports(page, limit);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newReport = addReport(body);
    return NextResponse.json({ message: 'Report saved successfully', report: newReport }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error saving report', error: (error as Error).message }, { status: 500 });
  }
}