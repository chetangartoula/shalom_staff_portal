
import { NextResponse } from 'next/server';
import { reports } from '../../data';

interface Params {
  params: {
    groupId: string;
  };
}

export async function getReportByGroupId(groupId: string) {
  const report = reports.find(r => r.groupId === groupId);
  return report || null;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { groupId } = params;
    const report = await getReportByGroupId(groupId);
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
    const { groupId } = params;
    const body = await request.json();
    const reportIndex = reports.findIndex(r => r.groupId === groupId);

    if (reportIndex > -1) {
      reports[reportIndex] = { ...reports[reportIndex], ...body };
      return NextResponse.json({ message: 'Report updated successfully', report: reports[reportIndex] }, { status: 200 });
    }
    return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating report', error: (error as Error).message }, { status: 500 });
  }
}
