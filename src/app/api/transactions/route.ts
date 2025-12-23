import { NextResponse } from 'next/server';
import { fetchTransactions } from '@/lib/api-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    
    // Fetch transactions from the real API
    try {
      const transactionsData = await fetchTransactions(page);
      return NextResponse.json(transactionsData);
    } catch (apiError) {
      console.error('Error fetching transactions from API:', apiError);
      return NextResponse.json({ message: 'Failed to fetch transactions from API' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching transactions', error: (error as Error).message }, { status: 500 });
  }
}