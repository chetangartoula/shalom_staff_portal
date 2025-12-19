import { NextResponse } from 'next/server';
import { getAirportPickUp } from '../data';
import { fetchAirportPickUp } from '@/lib/api-service';

export async function GET() {
  // Fetch from the real API
  try {
    const data = await fetchAirportPickUp();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from API, falling back to mock data:', error);
    // Fallback to mock data if API fails
    const data = getAirportPickUp();
    return NextResponse.json(data);
  }
}