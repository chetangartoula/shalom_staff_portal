import { NextResponse } from 'next/server';
import { fetchExtraServices } from '@/lib/api-service';

export async function GET() {
  try {
    const extraServices = await fetchExtraServices();
    return NextResponse.json({ extraServices });
  } catch (error) {
    console.error('Error in extra services API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extra services' },
      { status: 500 }
    );
  }
}