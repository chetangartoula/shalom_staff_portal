import { NextResponse } from 'next/server';
import { getAllAssignmentsWithDetails } from '../data';
import { fetchAssignments } from '@/lib/api-service';

export async function GET() {
  try {
    // Fetch from the real API
    try {
      const data = await fetchAssignments();
      return NextResponse.json(data);
    } catch (apiError: any) {
      // Check if the error is related to session expiration
      if (apiError.message && (apiError.message.includes('Session expired') || apiError.message.includes('Authentication'))) {
        console.error('Authentication error in assignments API:', apiError.message);
        return NextResponse.json(
          { message: 'Authentication required', error: apiError.message },
          { status: 401 }
        );
      }
      
      console.error('Error fetching from API, falling back to mock data:', apiError);
      // Fallback to mock data if API fails
      const assignments = await getAllAssignmentsWithDetails();
      return NextResponse.json({ assignments });
    }
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching assignments', error: error.message }, { status: 500 });
  }
}