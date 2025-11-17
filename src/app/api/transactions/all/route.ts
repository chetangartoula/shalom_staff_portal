
import { NextResponse } from 'next/server';
import { getPaginatedTransactions } from '../../data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  try {
    const data = getPaginatedTransactions(page, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching paginated transactions:", error);
    return NextResponse.json({ message: 'Error fetching transactions', error: (error as Error).message }, { status: 500 });
  }
}

    