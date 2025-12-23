import { NextResponse } from 'next/server';
import { getAllAssignmentsWithDetails } from '../data';
import { fetchAssignments } from '@/lib/api-service';

export async function GET() {
  try {
    // Fetch from the real API
    try {
      const data = await fetchAssignments();
      return NextResponse.json(data);
    } catch (apiError) {
      console.error('Error fetching from API, falling back to mock data:', apiError);
      // Fallback to mock data if API fails
      const assignments = await getAllAssignmentsWithDetails();
      return NextResponse.json({ assignments });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching assignments', error: (error as Error).message }, { status: 500 });
  }
}