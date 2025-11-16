
import { NextResponse } from 'next/server';
import { reports, getPaginatedReports, addReport } from '../data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  const data = getPaginatedReports(page, limit);

  return NextResponse.json(data);
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newReport = addReport(body);
    console.log('Saved Report:', JSON.stringify(newReport, null, 2));
    return NextResponse.json({ message: 'Report saved successfully', report: body }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error saving report', error: (error as Error).message }, { status: 500 });
  }
}
