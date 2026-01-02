import { NextResponse } from 'next/server';
import { fetchPaymentDetails } from '@/lib/api-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    
    // Fetch payment details from the real API
    try {
      const paymentDetails = await fetchPaymentDetails(groupId);
      return NextResponse.json(paymentDetails);
    } catch (apiError: any) {
      // Check if the error is related to session expiration
      if (apiError.message && (apiError.message.includes('Session expired') || apiError.message.includes('Authentication'))) {
        console.error('Authentication error in payment details API:', apiError.message);
        return NextResponse.json(
          { message: 'Authentication required', error: apiError.message },
          { status: 401 }
        );
      }
      
      console.error('Error fetching payment details from API:', apiError);
      return NextResponse.json({ message: 'Failed to fetch payment details from API' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching payment details', error: (error as Error).message }, { status: 500 });
  }
}