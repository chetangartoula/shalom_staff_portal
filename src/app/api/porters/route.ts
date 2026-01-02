import { NextResponse } from 'next/server';
import { getPorters } from '../data';
import { fetchPorters } from '@/lib/api-service';

export async function GET() {
  // Fetch from the real API
  try {
    const data = await fetchPorters();
    return NextResponse.json(data);
  } catch (error: any) {
    // Check if the error is related to session expiration
    if (error.message && (error.message.includes('Session expired') || error.message.includes('Authentication'))) {
      console.error('Authentication error in porters API:', error.message);
      return NextResponse.json(
        { message: 'Authentication required', error: error.message },
        { status: 401 }
      );
    }
    
    console.error('Error fetching from API, falling back to mock data:', error);
    // Fallback to mock data if API fails
    const data = getPorters();
    return NextResponse.json(data);
  }
}