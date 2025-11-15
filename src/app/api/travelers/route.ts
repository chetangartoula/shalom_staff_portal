
import { NextResponse } from 'next/server';
import { addTravelers } from '../data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // In a real app, you'd handle file uploads and save to a database
    const newTravelerGroup = addTravelers(body);
    console.log('Saved Travelers:', JSON.stringify(newTravelerGroup, null, 2));
    return NextResponse.json({ message: 'Traveler details saved successfully', data: newTravelerGroup }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error saving traveler details', error: (error as Error).message }, { status: 500 });
  }
}
