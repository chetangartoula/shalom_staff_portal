import { NextResponse } from 'next/server';
import { fetchPermits } from '@/lib/api-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params; // Await the params object
    const permits = await fetchPermits(tripId);
    return NextResponse.json({ permits });
  } catch (error) {
    console.error('Error in permits API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permits' },
      { status: 500 }
    );
  }
}