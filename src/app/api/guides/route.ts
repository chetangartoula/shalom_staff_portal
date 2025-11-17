
import { NextResponse } from 'next/server';
import { getGuides } from '../data';

export async function GET() {
  const data = getGuides();
  return NextResponse.json(data);
}
