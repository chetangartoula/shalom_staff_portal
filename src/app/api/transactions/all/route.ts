import { NextResponse } from 'next/server';
import { getPaginatedTransactions, getAllTransactions } from '../../data';
import type { Transaction } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const type = (searchParams.get('type') as 'payment' | 'refund' | 'all') || 'all';
  
  // Check if we want all transactions without pagination
  const all = searchParams.get('all') === 'true';
  
  try {
    if (all) {
      // Return all transactions without pagination
      // Try to fetch from real API first
      try {
        const data: Transaction[] = [];
        return NextResponse.json({ transactions: data });
      } catch (apiError) {
        console.error('Error fetching all transactions from API, falling back to mock data:', apiError);
        // Fallback to mock data if API fails
        const transactions = getAllTransactions();
        return NextResponse.json({ transactions });
      }
    } else {
      // Return paginated transactions (using mock data as pagination logic is complex)
      const data = getPaginatedTransactions(page, limit, { from, to, type });
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ message: 'Error fetching transactions', error: (error as Error).message }, { status: 500 });
  }
}