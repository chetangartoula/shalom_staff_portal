
import { NextResponse } from 'next/server';
import { getTransactionsByGroupId, addTransaction } from '../../data';

interface Params {
  params: {
    groupId: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { groupId } = await params; // Await the params object
    const transactions = getTransactionsByGroupId(groupId);
    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching transactions', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { groupId } = await params; // Await the params object
    const body = await request.json();
    
    if (!body.amount || !body.type || !body.date) {
        return NextResponse.json({ message: 'Invalid transaction data submitted.' }, { status: 400 });
    }

    const newTransaction = addTransaction(groupId, body);
    return NextResponse.json({ message: 'Transaction added successfully', transaction: newTransaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding transaction', error: (error as Error).message }, { status: 500 });
  }
}
