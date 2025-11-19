import { NextResponse } from 'next/server';
import { getReportByGroupId, updateReport } from '../../data';

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { groupId } = await params; // Await the params object
    const report = getReportByGroupId(groupId);
    if (report) {
      return NextResponse.json(report);
    }
    return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching report', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
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