import { NextResponse } from 'next/server';
import { getTransactionsByGroupId } from '../../data';
import { fetchTransactionsByGroupId, addTransaction } from '@/lib/api-service';

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params; // Await the params object
    
    // Fetch from the real API
    try {
      const data = await fetchTransactionsByGroupId(groupId);
      return NextResponse.json(data);
    } catch (apiError) {
      console.error('Error fetching from API, falling back to mock data:', apiError);
      // Fallback to mock data if API fails
      const transactions = getTransactionsByGroupId(groupId);
      return NextResponse.json({ transactions });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching transactions', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params; // Await the params object
    const body = await request.json();

    if (!body.amount || !body.type || !body.date) {
      return NextResponse.json({ message: 'Invalid transaction data submitted.' }, { status: 400 });
    }

    // Try to add transaction to real API
    try {
      const result = await addTransaction(groupId, body);
      return NextResponse.json(result, { status: 201 });
    } catch (apiError) {
      console.error('Error adding transaction to API, falling back to mock data:', apiError);
      // Fallback to mock data if API fails
      // Note: We don't have a mock addTransaction function, so we'll just return an error
      return NextResponse.json({ message: 'Failed to add transaction to API' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Error adding transaction', error: (error as Error).message }, { status: 500 });
  }
}