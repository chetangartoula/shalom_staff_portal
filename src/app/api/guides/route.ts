import { NextResponse } from 'next/server';
import { getGuides } from '../data';
import { fetchGuides } from '@/lib/api-service';

export async function GET() {
  // Fetch from the real API
  try {
    const data = await fetchGuides();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from API, falling back to mock data:', error);
    // Fallback to mock data if API fails
    const data = getGuides();
    return NextResponse.json(data);
  }
}