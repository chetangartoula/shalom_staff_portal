
import { NextResponse } from 'next/server';
import { getTreks, addTrek as apiAddTrek } from '../data';
import type { Trek } from '@/lib/types';

export async function GET() {
  const data = getTreks();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<Trek, 'id'>;
    const newTrek = apiAddTrek(body);
    return NextResponse.json({ message: 'Trek added successfully', trek: newTrek }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding trek', error: (error as Error).message }, { status: 500 });
  }
}
