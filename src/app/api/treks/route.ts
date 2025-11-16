
import { NextResponse } from 'next/server';
import { treks, addTrek } from '../data';


export async function getTreks() {
  // In a real app, you'd fetch this from a database
  return { treks };
}

export async function GET() {
  const data = await getTreks();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In a real app, you'd validate the body and save to a database
    const newTrek = addTrek(body);
    return NextResponse.json({ message: 'Trek added successfully', trek: newTrek }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding trek', error: (error as Error).message }, { status: 500 });
  }
}
