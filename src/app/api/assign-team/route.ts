import { NextResponse } from 'next/server';
import { assignTeam } from '@/lib/api-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guides, porters, package: packageId } = body;

    // Validate required fields
    if (!guides || !porters || !packageId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Call the assign team function
    const result = await assignTeam(guides, porters, packageId);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error assigning team:', error);
    return NextResponse.json({ message: 'Error assigning team', error: (error as Error).message }, { status: 500 });
  }
}