import { NextResponse } from 'next/server';
import { fetchServices } from '@/lib/api-service';

export async function GET() {
  try {
    const services = await fetchServices();
    return NextResponse.json({ services });
  } catch (error: any) {
    // Check if the error is related to session expiration
    if (error.message && (error.message.includes('Session expired') || error.message.includes('Authentication'))) {
      console.error('Authentication error in services API:', error.message);
      return NextResponse.json(
        { message: 'Authentication required', error: error.message },
        { status: 401 }
      );
    }
    
    console.error('Error in services API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}