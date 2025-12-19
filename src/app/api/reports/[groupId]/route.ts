import { NextResponse } from 'next/server';
import { getReportByGroupId, updateReport } from '../../data';
import { fetchGroupAndPackageById } from '@/lib/api-service';

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params; // Await the params object
    
    // Fetch from the real API
    try {
      const report = await fetchGroupAndPackageById(groupId);
      
      // Add the full URL to the reportUrl field
      const baseUrl = `${new URL(request.url).protocol}//${new URL(request.url).host}`;
      const fullReport = {
        ...report,
        reportUrl: `${baseUrl}${report.reportUrl}`
      };
      
      return NextResponse.json(fullReport);
    } catch (apiError) {
      console.error('Error fetching from API, falling back to mock data:', apiError);
      // Fallback to mock data if API fails
      const report = getReportByGroupId(groupId);
      if (report) {
        return NextResponse.json(report);
      }
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching report', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params; // Await the params object
    const body = await request.json();
    const updated = updateReport(groupId, body);

    if (updated) {
      const fullReport = getReportByGroupId(groupId);
      return NextResponse.json({ message: 'Report updated successfully', report: fullReport }, { status: 200 });
    }
    return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating report', error: (error as Error).message }, { status: 500 });
  }
}