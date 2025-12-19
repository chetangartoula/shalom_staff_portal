import { NextResponse } from 'next/server';
import { getPorters } from '../data';
import { fetchPorters } from '@/lib/api-service';

export async function GET() {
  // Fetch from the real API
  try {
    const data = await fetchPorters();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from API, falling back to mock data:', error);
    // Fallback to mock data if API fails
    const data = getPorters();
    return NextResponse.json(data);
  }
}