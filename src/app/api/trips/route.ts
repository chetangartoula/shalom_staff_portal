import { NextResponse } from 'next/server';
import { fetchTrips } from '@/lib/api-service';

export async function GET() {
  try {
    const data = await fetchTrips();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in trips API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}