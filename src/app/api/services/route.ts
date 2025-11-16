
import { NextResponse } from 'next/server';
import { services, addService } from '../data';
import type { Service } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const paginatedServices = services.slice(startIndex, endIndex);
  
  return NextResponse.json({ 
    services: paginatedServices,
    total: services.length,
    hasMore: endIndex < services.length,
  });
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In a real app, you'd validate the body
    const newService = addService(body);
    return NextResponse.json({ message: 'Service added successfully', service: newService }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding service', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    try {
        const body = (await request.json()) as { services: Service[] };
        // This is a mock bulk update. In a real app, this might be more complex.
        // For now, we'll just log it. A more robust solution would update each service.
        console.log('Bulk update received:', body.services);
        return NextResponse.json({ message: 'Services updated successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Error updating services', error: (error as Error).message }, { status: 500 });
    }
}
