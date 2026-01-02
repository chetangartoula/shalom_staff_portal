import { NextResponse } from 'next/server';
import { getGuides } from '../data';
import { fetchGuides } from '@/lib/api-service';

export async function GET() {
  // Fetch from the real API
  try {
    const data = await fetchGuides();
    return NextResponse.json(data);
  } catch (error: any) {
    // Check if the error is related to session expiration
    if (error.message && (error.message.includes('Session expired') || error.message.includes('Authentication'))) {
      console.error('Authentication error in guides API:', error.message);
      return NextResponse.json(
        { message: 'Authentication required', error: error.message },
        { status: 401 }
      );
    }
    
    console.error('Error fetching from API, falling back to mock data:', error);
    // Fallback to mock data if API fails
    const data = getGuides();
    return NextResponse.json(data);
  }
}