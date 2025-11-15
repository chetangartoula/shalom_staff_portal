
import { NextResponse } from 'next/server';
import { addReport } from '../data';

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
