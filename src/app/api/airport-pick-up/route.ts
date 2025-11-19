import { NextResponse } from 'next/server';
import { getAirportPickUp } from '../data';

export async function GET() {
  const data = getAirportPickUp();
  return NextResponse.json(data);
}