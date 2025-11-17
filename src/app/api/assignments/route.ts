
import { NextResponse } from 'next/server';
import { getAllAssignmentsWithDetails } from '../data';

export async function GET() {
  try {
    const assignments = await getAllAssignmentsWithDetails();
    return NextResponse.json({ assignments });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching assignments', error: (error as Error).message }, { status: 500 });
  }
}
