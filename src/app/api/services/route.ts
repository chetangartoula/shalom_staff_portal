import { NextResponse } from 'next/server';
import { fetchServices } from '@/lib/api-service';

export async function GET() {
  try {
    const services = await fetchServices();
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error in services API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}