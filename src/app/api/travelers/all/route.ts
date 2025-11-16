import { NextResponse } from 'next/server';
import { getAllTravelers } from '../../data';

export async function GET() {
  try {
    const data = await getAllTravelers();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching all travelers:", error);
    return NextResponse.json({ message: 'Error fetching travelers', error: (error as Error).message }, { status: 500 });
  }
}
